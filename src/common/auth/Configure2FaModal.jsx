import {LoadingOverlay, Modal} from "@mantine/core";
import {useTranslation} from "react-i18next";
import Switch from "../ui/Switch.jsx";
import useFetch from "../api/useFetch.js";
import {useEffect, useState} from "react";
import QRCode from "qrcode";
import NotificationState from "../stores/NotificationState.js";
import {useDisclosure} from "@mantine/hooks";
import Button from "../ui/Button.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheck} from "@fortawesome/free-solid-svg-icons";

export default function Configure2FaModal({isOpen, close, userId, onConfirmUsed2Fa = () => {}}) {
    const {t} = useTranslation();
    const {get: get2FaConfig, put: update2FaConfig} = useFetch(
        `user/${userId}/2fa-config`
    );
    const [isUse2Fa, setIsUse2Fa] = useState(false);
    const [urlQrCode, setUrlQrCode] = useState("");
    const {notify} = NotificationState((state) => state);
    const [visible, {open: openLoading, close: closeLoading}] =
        useDisclosure(false);
    const [isUse2FaOriginal, setIsUse2FaOriginal] = useState(null); // data from backend

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        initialize();
    }, [isOpen]);

    async function initialize() {
        openLoading();
        const config2FaInfo = await get2FaConfig();
        setIsUse2FaOriginal(config2FaInfo.is_use_2fa);
        if (config2FaInfo?.is_use_2fa && config2FaInfo?.totp_uri) {
            const urlQrCode = await QRCode.toDataURL(config2FaInfo.totp_uri, {
                type: "image/png"
            });
            setUrlQrCode(urlQrCode);
            setIsUse2Fa(true);
        } else {
            setUrlQrCode("");
            setIsUse2Fa(false);
        }
        closeLoading();
    }

    async function confirm2Fa() {
        try {
            openLoading();
            const result = await update2FaConfig({
                confirmed: true,
                is_use_2fa: isUse2Fa
            });
            setIsUse2FaOriginal(result.is_use_2fa);
            notify({
                message: t("Saved successfully!"),
                type: "success"
            });
            close();

            if (result?.recovery_codes?.length) {
                onConfirmUsed2Fa(result.recovery_codes);
            }
        } catch (error) {
            console.error(error);
            notify({
                message: error.message,
                type: "error"
            });
        } finally {
            closeLoading();
        }
    }

    async function handleUse2FaChange(isUse2Fa) {
        setIsUse2Fa(isUse2Fa);
        try {
            // when switch on. call api to get uri to generate QR if QR not exist yet.
            if (isUse2Fa && !urlQrCode) {
                openLoading();
                const {totp_uri} = await update2FaConfig({
                    is_use_2fa: isUse2Fa,
                    confirmed: false
                });
                if (totp_uri) {
                    const urlQrCode = await QRCode.toDataURL(totp_uri, {
                        type: "image/png"
                    });
                    setUrlQrCode(urlQrCode);
                    // setDisabledBtnConfirm(false);
                } else {
                    // setDisabledBtnConfirm(true);
                    setUrlQrCode("");
                }
            }
        } catch (error) {
            console.error(error);
            notify({
                message: error.message,
                type: "error"
            });
        } finally {
            closeLoading();
        }
    }

    return (
        <Modal
            opened={isOpen}
            onClose={close}
            title={
                <div className={`font-semibold text-lg`}>
                    {t("Configure Two Factor Authentication")}
                </div>
            }
            size={500}
        >
            <LoadingOverlay
                visible={visible}
                zIndex={1000}
                overlayProps={{
                    radius: "sm",
                    blur: 2
                }}
                loaderProps={{
                    color: "pink",
                    type: "bars"
                }}
            />
            <div className="border-t py-4">
                <div className="flex items-center justify-between">
                    <Switch
                        checked={isUse2Fa}
                        onChange={(event) =>
                            handleUse2FaChange(event.currentTarget.checked)
                        }
                        label={t("Enable Two Factor Authentication")}
                    />
                </div>
                {isUse2Fa && urlQrCode && (
                    <div className="mt-8">
                        <div>
                            {t(
                                "Please use Google Authenticator app to scan the QR code below:"
                            )}
                        </div>
                        <img
                            src={urlQrCode}
                            className="w-[200px] h-[200px] mx-auto mt-8"
                        />
                    </div>
                )}

                <div className="w-full grow flex mt-8">
                    <Button
                        onClick={confirm2Fa}
                        className="w-full grow"
                        disabled={isUse2Fa === isUse2FaOriginal}
                    >
                        <FontAwesomeIcon
                            icon={faCheck}
                            className="mr-1 h-4 w-4"
                        />
                        {t("Confirm")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
