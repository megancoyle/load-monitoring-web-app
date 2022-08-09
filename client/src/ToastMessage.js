import toast from "react-hot-toast";

function ToastMessage(highLoadCount, recoveredLoadCount) {
    // Trigger toast messages if high load/recovered load has lasted more than two minutes
    if (highLoadCount) {
        toast.error('High CPU Load');
    }

    if (recoveredLoadCount) {
        toast.success('CPU Load Recovered');
    }
}

export default ToastMessage;
