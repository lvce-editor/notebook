import json
import signal
import sys
from jupyter_client import KernelManager

manager = KernelManager(kernel_name=sys.argv[1])
client = None

def stop(*_):
    if manager.has_kernel:
        manager.shutdown_kernel(now=True)
    sys.exit(0)

signal.signal(signal.SIGTERM, stop)
try:
    manager.start_kernel()
    client = manager.client()
    client.start_channels()
    client.wait_for_ready(timeout=30)
    for line in sys.stdin:
        request = json.loads(line)
        message_id = client.execute(request['source'], allow_stdin=False, stop_on_error=True)
        outputs = []
        count = None
        output_bytes = 0
        clear_pending = False
        while True:
            message = client.get_iopub_msg(timeout=60)
            if message.get('parent_header', {}).get('msg_id') != message_id:
                continue
            kind = message['msg_type']
            content = message['content']
            if kind == 'status' and content['execution_state'] == 'idle':
                break
            if kind == 'execute_input':
                count = content['execution_count']
            elif kind == 'clear_output':
                if content.get('wait'):
                    clear_pending = True
                else:
                    outputs = []
            elif kind in ('stream', 'display_data', 'execute_result', 'error'):
                if clear_pending:
                    outputs = []
                    clear_pending = False
                output_bytes += len(json.dumps(content))
                if output_bytes > 8 * 1024 * 1024:
                    raise RuntimeError('Notebook output exceeded 8 MB')
                output = dict(content, output_type=kind)
                output.pop('transient', None)
                outputs.append(output)
        print(json.dumps({'outputs': outputs, 'execution_count': count}), flush=True)
finally:
    if client:
        client.stop_channels()
    if manager.has_kernel:
        manager.shutdown_kernel(now=True)
