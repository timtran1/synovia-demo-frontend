import { useDisclosure } from "@mantine/hooks";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import useFetch from "../../common/api/useFetch.js";
import BackendHostURLState from "../../common/stores/BackendHostURLState.js";
import NotificationState from "../../common/stores/NotificationState.js";
import Button from "../../common/ui/Button.jsx";
import PasswordInput from "../../common/ui/PasswordInput.jsx";
import RecoveryCodesModal from "../../common/auth/RecoveryCodesModal.jsx";

export default function ResetPassword() {
    const location = useLocation();
    const navigate = useNavigate();
    const {t} = useTranslation();
    const {backendHost} = BackendHostURLState((state) => state);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordResetLoading, setIsPasswordResetLoading] = useState(false);
    const {notify} = NotificationState((state) => state);
    const {post} = useFetch("check-2fa-config");
    const [urlQrCode, setUrlQrCode] = useState("");
    const [
        shouldConfirm2FaWhenChangePassword,
        setShouldConfirm2FaWhenChangePassword
    ] = useState(false);
    const [
        isOpenRecoveryCodesModal,
        {open: openRecoveryCodesModal, close: closeRecoveryCodesModal}
    ] = useDisclosure();
    const [recoveryCodes, setRecoveryCodes] = useState([]);

    useEffect(() => {
        check2FaConfig();
    }, []);

    async function check2FaConfig() {
        try {
            const searchParams = new URLSearchParams(location.search);
            const token = searchParams.get("t");
            const info2Fa = await post({token});
            if (!info2Fa) {
                return;
            }
            if (
                !info2Fa.is_organiztion_require_2fa ||
                info2Fa.is_already_config_2fa
            ) {
                setUrlQrCode("");
                setShouldConfirm2FaWhenChangePassword(false);
                return;
            }
            if (info2Fa.totp_uri) {
                const urlQrCode = await QRCode.toDataURL(info2Fa.totp_uri, {
                    type: "image/png"
                });
                setUrlQrCode(urlQrCode);
                setShouldConfirm2FaWhenChangePassword(true);
            }
        } catch (err) {
            notify({
                message: err.message,
                type: "error"
            });
        }
    }
    
    async function handleResetPassword(e) {
        try {
            e.preventDefault();
            const isValid = e.target.reportValidity();
            if (!isValid) {
                return;
            }
            if (newPassword !== confirmPassword) {
                notify({
                    message: t("Password and confirm password does not match"),
                    type: "error"
                });
                return;
            }
            setIsPasswordResetLoading(true);
            const headers = {
                "Content-Type": "application/json"
            };
            const searchParams = new URLSearchParams(location.search);
            const token = searchParams.get("t");
            const response = await fetch(`${backendHost}/reset-password`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword,
                    confirmed_2fa: shouldConfirm2FaWhenChangePassword
                })
            });
            if (response.status !== 200) {
                const {detail} = await response.json();
                if (typeof detail === "string") {
                    notify({
                        message: detail,
                        type: "error"
                    });
                }
            } else {
                notify({
                    type: "success",
                    message: t("Password changed successfully!")
                });
                const {recovery_codes} = await response.json();
                if (recovery_codes) {
                    setRecoveryCodes(recovery_codes);
                    openRecoveryCodesModal();
                    return;
                }
            }
            navigate("/login");
        } catch (err) {
            notify({
                message: err.message,
                type: "error"
            });
        } finally {
            setIsPasswordResetLoading(false);
        }
    }
    return (
        <main className={`max-w-screen-xl grow mx-auto pt-10 w-full`}>
            <form
                onSubmit={handleResetPassword}
                className={`flex flex-col gap-2 max-w-[400px] mx-auto`}
            >
                <PasswordInput
                    label={t(`New password`)}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <PasswordInput
                    label={t(`Confirm password`)}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                {urlQrCode && (
                    <div className="mt-4">
                        <div>
                            {t(
                                "Your organization require Two-Factor-Authentication. Please scan the QR below with the Google Authenticator app."
                            )}
                        </div>
                        <img
                            src={urlQrCode}
                            className="w-[200px] h-[200px] mx-auto"
                        />
                    </div>
                )}
                <Button
                    type={`submit`}
                    loading={isPasswordResetLoading}
                    disabled={isPasswordResetLoading}
                    className="mt-3"
                >
                    {t("Submit")}
                </Button>
            </form>
            <RecoveryCodesModal
                isOpen={isOpenRecoveryCodesModal}
                close={closeRecoveryCodesModal}
                recoveryCodes={recoveryCodes}
                onFinish={() => navigate("/login")}
            />
        </main>
    );
}
