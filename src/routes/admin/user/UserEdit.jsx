import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFingerprint, faAddressBook, faShieldHalved, faKey} from "@fortawesome/free-solid-svg-icons";
import Card from "../../../common/ui/Card.jsx";
import TextInput from "../../../common/ui/TextInput.jsx";
import Select from "../../../common/ui/Select.jsx";
import Divider from "../../../common/ui/Divider.jsx";
import H1 from "../../../common/ui/H1.jsx";
import H3 from "../../../common/ui/H3.jsx";
import RecordSelectMulti from "../../../common/ui/RecordSelectMulti.jsx";
import {Modal, Tabs} from "@mantine/core";
import useModel from "../../../common/api/useModel.jsx";
import NotificationState from "../../../common/stores/NotificationState.js";
import {useNavigate, useParams} from "react-router-dom";
import countries from "../../../constants/countries.js";
import useMany2Many from "../../../common/api/useMany2Many.js";
import {useEffect, useState} from "react";
import useAuthentication from "../../../common/api/useAuthentication.js";
import EditFormActionBar from "../../../common/ui/EditFormActionBar.jsx";
import FormViewSkeleton from "../../../common/ui/FormViewSkeleton.jsx";
import PasswordInput from "../../../common/ui/PasswordInput.jsx";
import Button from "../../../common/ui/Button.jsx";
import FileInput from "../../../common/ui/FileInput.jsx";
import VisibilityControl from "../../../common/auth/VisibilityControl.jsx";
import BackendHostURLState from "../../../common/stores/BackendHostURLState.js";
import {useDisclosure, usePrevious} from "@mantine/hooks";
import Configure2FaModal from "../../../common/auth/Configure2FaModal.jsx";
import RecoveryCodesModal from "../../../common/auth/RecoveryCodesModal.jsx";

export default function UserEdit() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {user: currentUser, fetchUser} = useAuthentication();
    const {id} = useParams();
    const query = useModel("user", {
        id,
        autoFetch: true
    });
    const {record, setRecord, update, loading} = query;
    const {update: updateRoles} = useMany2Many({
        junctionModel: "user_role",
        thisForeignKeyField: "user_id",
        thatForeignKeyField: "role_id",
        relationshipName: "roles"
    });
    const [roles, setRoles] = useState(record?.roles || []);
    const {user} = useAuthentication();
    const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changePasswordLoading, setChangePasswordLoading] = useState(false);
    const {notify} = NotificationState((state) => state);
    const {backendHost} = BackendHostURLState((state) => state);
    const [isOpen2FaModal, {open: open2FaModal, close: close2FaModal}] = useDisclosure();
    const [isOpenRecoveryCodesModal, {open: openRecoveryCodesModal, close: closeRecoveryCodesModal}] = useDisclosure();
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    // Set the roles copy when the user arrives
    const previousRecordValue = usePrevious(record);
    useEffect(() => {
        if (!previousRecordValue && record) {
            setRoles(record.roles);
        }
    }, [record]);

    async function handleChangePasswordSubmit(e) {
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
        if (newPassword === oldPassword) {
            notify({
                message: t("The new password is equal to the old password"),
                type: "warning"
            });
            return;
        }
        try {
            setChangePasswordLoading(true);
            const headers = {
                "Content-Type": "application/json"
            };
            if (user?.token) {
                headers.Authorization = `Bearer ${user.token}`;
            }
            const response = await fetch(`${backendHost}/change-password`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });
            if (response.status !== 200) {
                const {detail} = await response.json();
                if (Array.isArray(detail) && detail.length) {
                    notify({
                        message: detail[0].msg,
                        type: "error"
                    });
                } else if (typeof detail === "string") {
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
                closeModal();
            }
        } catch (err) {
            console.error(err);
            notify({
                message: t("An error occurred"),
                type: "error"
            });
        } finally {
            setChangePasswordLoading(false);
        }
    }

    function closeModal() {
        setChangePasswordModalOpen(false);
        clearForm();
    }

    function clearForm() {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
    }

    async function handleSubmit(e) {
        try {
            e.preventDefault();
            await Promise.all([update(record), updateRoles(roles, record)]);

            // If the user is editing themselves, we need to update the user object
            if (currentUser.id === record.id) {
                await fetchUser();
            }
            notify({
                message: t("User updated successfully!"),
                type: "success"
            });
            navigate(-1);
        } catch (error) {
            console.error(error);
            notify({
                message: error.message,
                type: "error"
            });
        }
    }

    return (
        <main className={`max-w-screen-xl m-auto my-[20px] px-[24px]`}>
            <form onSubmit={handleSubmit}>
                <EditFormActionBar title={t(`Edit user`)} loading={loading}/>

                {record ? (
                    <Card>
                        <div className={`flex items-start justify-between gap-2`}>
                            <div className={`flex items-center gap-2`}>
                                <FileInput
                                    value={record.image?.name}
                                    onChange={(file) => {
                                        setRecord({
                                            ...record,
                                            image: file,
                                            image_id: file?.id
                                        })
                                    }}
                                    type="image"
                                />
                                <H1>{record.username}</H1>
                            </div>

                            {currentUser.id === record.id && (
                                <div className={`flex gap-2`}>
                                    <Button onClick={() => setChangePasswordModalOpen(true)}>
                                        <FontAwesomeIcon
                                            icon={faKey}
                                            className="mr-1 h-4 w-4"
                                            size={`sm`}
                                        />
                                        {t("Change Password")}
                                    </Button>
                                    <Button onClick={open2FaModal}>
                                        <FontAwesomeIcon
                                            icon={faShieldHalved}
                                            className="mr-1 h-4 w-4"
                                            size={`sm`}
                                        />
                                        {t("Configure 2FA")}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className={`flex gap-2 my-2 flex-wrap`}>
                            <TextInput
                                className={`grow`}
                                label={t("Username")}
                                description={t("Unique identifier for your user")}
                                placeholder={t(`john.doe`)}
                                required
                                value={record.username}
                                onChange={(e) =>
                                    setRecord({
                                        ...record,
                                        username: e.target.value
                                    })
                                }
                            />
                            <TextInput
                                className={`grow`}
                                label={t("Email")}
                                value={record.email}
                                description={t("Unique primary email")}
                                type={`email`}
                                placeholder={t("me@example.com")}
                                onChange={(e) =>
                                    setRecord({
                                        ...record,
                                        email: e.target.value
                                    })
                                }
                                required
                            />
                        </div>

                        <div className={`flex gap-2 my-2 flex-wrap`}>
                            <TextInput
                                label={t("Company name")}
                                value={record.company_name}
                                onChange={(e) =>
                                    setRecord({
                                        ...record,
                                        company_name: e.target.value
                                    })
                                }
                            />
                        </div>

                        <Tabs variant="outline" defaultValue="contact" className={`mt-4`}>
                            <Tabs.List>
                                <Tabs.Tab
                                    value="contact"
                                    leftSection={<FontAwesomeIcon icon={faAddressBook} className="h-4 w-4 "/>}
                                >
                                    {t("Contact Info")}
                                </Tabs.Tab>
                                <VisibilityControl roleIds={["super_admin_role", "admin_role"]} render={false}>
                                    <Tabs.Tab
                                        value="access"
                                        leftSection={<FontAwesomeIcon icon={faFingerprint} className="h-4 w-4 "/>}
                                    >
                                        {t("Access")}
                                    </Tabs.Tab>
                                </VisibilityControl>
                            </Tabs.List>

                            <VisibilityControl roleIds={["super_admin_role", "admin_role"]} render={false}>
                                <Tabs.Panel value="access" className={`mt-4`}>
                                    <RecordSelectMulti
                                        label={t(`Roles`)}
                                        model={`role`}
                                        value={roles}
                                        onChange={setRoles}
                                    />
                                </Tabs.Panel>
                            </VisibilityControl>

                            <Tabs.Panel value="contact">
                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <Select
                                        label={t("Title")}
                                        classNames={{
                                            root: "max-w-[80px]"
                                        }}
                                        data={["Mr", "Mrs", "Ms", "Dr", "Prof"]}
                                        searchable
                                        value={record.title}
                                        onChange={(value) =>
                                            setRecord({
                                                ...record,
                                                title: value
                                            })
                                        }
                                    />
                                    <TextInput
                                        label={t("Display name")}
                                        value={record.name}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                name: e.target.value
                                            })
                                        }
                                    />
                                    <TextInput
                                        label={t("First name")}
                                        value={record.first_name}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                first_name: e.target.value
                                            })
                                        }
                                    />
                                    <TextInput
                                        label={t("Last name")}
                                        value={record.last_name}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                last_name: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <TextInput
                                        label={t("Website")}
                                        value={record.website}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                website: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <TextInput
                                        label={t("Phone")}
                                        value={record.phone}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                phone: e.target.value
                                            })
                                        }
                                    />
                                    <TextInput
                                        label={t("Mobile")}
                                        value={record.mobile}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                mobile: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <FileInput
                                        label={t("CV")}
                                        value={record.cv?.name}
                                        height={40}
                                        width={40}
                                        onChange={(file) => {
                                            setRecord({
                                                ...record,
                                                cv: file,
                                                cv_attachment_id: file?.id
                                            })
                                        }}
                                    />
                                </div>

                                <H3 className={`mt-4`}>{t("Address")}</H3>
                                <Divider/>

                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <TextInput
                                        label={t("Street address")}
                                        value={record.street}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                street: e.target.value
                                            })
                                        }
                                    />
                                    <TextInput
                                        label={t("Street address line 2")}
                                        value={record.street2}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                street2: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <TextInput
                                        label={t("City")}
                                        value={record.city}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                city: e.target.value
                                            })
                                        }
                                    />
                                    <TextInput
                                        label={t("State")}
                                        value={record.state}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                state: e.target.value
                                            })
                                        }
                                    />
                                </div>

                                <div className={`flex gap-2 my-2 flex-wrap`}>
                                    <TextInput
                                        label={t("Zip code")}
                                        value={record.zip}
                                        classNames={{
                                            root: "max-w-[100px]"
                                        }}
                                        onChange={(e) =>
                                            setRecord({
                                                ...record,
                                                zip: e.target.value
                                            })
                                        }
                                    />
                                    <Select
                                        label={t("Country")}
                                        placeholder={t("Pick a country")}
                                        data={countries.map((country) => country.label)}
                                        searchable
                                        value={record.country}
                                        onChange={(value) =>
                                            setRecord({
                                                ...record,
                                                country: value
                                            })
                                        }
                                    />
                                </div>
                            </Tabs.Panel>
                        </Tabs>
                    </Card>
                ) : (
                    <FormViewSkeleton/>
                )}
            </form>

            <Modal
                opened={changePasswordModalOpen}
                onClose={closeModal}
                title={<div className={`font-bold`}>{t("Change Password")}</div>}
            >
                <form onSubmit={handleChangePasswordSubmit} className={`flex flex-col gap-2`}>
                    <PasswordInput
                        label={t(`Old password`)}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                    />
                    <PasswordInput
                        label={t(`New password`)}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <PasswordInput
                        label={t(`Confirm new password`)}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <Button
                        type={`submit`}
                        loading={changePasswordLoading}
                        disabled={changePasswordLoading}
                        className="mt-3"
                    >
                        {t("Submit")}
                    </Button>
                </form>
            </Modal>

            <Configure2FaModal
                isOpen={isOpen2FaModal}
                close={close2FaModal}
                userId={id}
                onConfirmUsed2Fa={(recoveryCodes) => {
                    setRecoveryCodes(recoveryCodes);
                    openRecoveryCodesModal();
                }}
            />
            <RecoveryCodesModal
                isOpen={isOpenRecoveryCodesModal}
                close={closeRecoveryCodesModal}
                recoveryCodes={recoveryCodes}
            />
        </main>
    );
}
