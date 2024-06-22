import {
    faCheck,
    faCircleCheck,
    faCopy,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Modal} from "@mantine/core";
import {useTranslation} from "react-i18next";
import NotificationState from "../stores/NotificationState.js";
import Button from "../ui/Button.jsx";
export default function RecoveryCodesModal({
    isOpen,
    close,
    onFinish,
    recoveryCodes = []
}) {
    const {t} = useTranslation();
    const {notify} = NotificationState((state) => state);
    function handleCopy() {
        const textToCopy = (recoveryCodes || []).join("\n");
        navigator.clipboard.writeText(textToCopy);
        notify({
            message: t("Recovery codes copied to clipboard!"),
            type: "success",
            duration: 1000
        });
    }
    function handleDownload() {
        const textToDownload = (recoveryCodes || []).join("\n");
        const blob = new Blob([textToDownload], {
            type: "text/plain"
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mini-tender-recovery-codes.txt";
        a.click();
        window.URL.revokeObjectURL(url);
    }
    function handleFinishBtnClick() {
        if (onFinish && typeof onFinish === "function") {
            onFinish();
        }
        close();
    }
    return (
        <Modal
            styles={{
                body: {
                    paddingLeft: 0,
                    paddingRight: 0
                }
            }}
            opened={isOpen}
            onClose={close}
            size={650}
            withCloseButton={false}
            title={
                <div className="flex items-center gap-4 px-4">
                    <FontAwesomeIcon
                        icon={faCircleCheck}
                        className="h-6 w-6 text-[#4DB783] self-start"
                    />
                    <div className={`font-semibold text-lg`}>
                        {t(
                            "Two-Factor Authentication - Enabled via Authenticator App"
                        )}
                    </div>
                </div>
            }
        >
            <div className="px-8 py-6 bg-[#F7F9FA]">
                <div className="text-[#E2393E] font-bold text-lg">
                    {t("Recovery Codes")}
                </div>
                <div className="mt-4 text-[#85909A]">
                    {t(
                        "Recovery codes are the backup codes to access your account in case you cannot receive two-factor authentication codes via the authenticator app."
                    )}
                </div>
                <div className="mt-2 text-[#85909A]">
                    {t(
                        "Make a copy or download these codes and keep them somewhere safe before you continue further."
                    )}
                </div>
                <div className="grid grid-cols-2 gap-y-2 my-8 text-[#26445A] font-semibold">
                    {recoveryCodes.map((code) => (
                        <div key={code} className="text-xl">
                            {code}
                        </div>
                    ))}
                </div>
                <div className="flex">
                    <Button
                        className="!bg-gray-300 !text-[#14354C]"
                        onClick={handleDownload}
                    >
                        <FontAwesomeIcon
                            icon={faDownload}
                            className="mr-2 h-4 w-4"
                        />
                        {t("Download")}
                    </Button>
                    <Button
                        className="ml-2 !bg-gray-300 !text-[#14354C]"
                        onClick={handleCopy}
                    >
                        <FontAwesomeIcon
                            icon={faCopy}
                            className="mr-2 h-4 w-4"
                        />
                        {t("Copy")}
                    </Button>
                </div>
            </div>
            <Button className="ml-8 mt-8" onClick={handleFinishBtnClick}>
                <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                {t("Finish Setup")}
            </Button>
        </Modal>
    );
}
