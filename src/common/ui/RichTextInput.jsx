import {forwardRef, useImperativeHandle} from "react";
import {useTranslation} from "react-i18next";
import {faImage} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useDisclosure} from "@mantine/hooks";
import {Link, RichTextEditor as MantineRichTextEditor} from "@mantine/tiptap";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import SubScript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import {useEditor} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ChooseAttachmentModal from "./ChooseAttachmentModal.jsx";

const RichTextInput = forwardRef((props, ref) => {
        const {t} = useTranslation();
        const {content = "", label} = props;
        const [isAttachmentModalOpened, {open: openImageModal, close: closeAttachmentModal}] =
            useDisclosure(false);
        const editor = useEditor({
            extensions: [
                StarterKit,
                Underline,
                Link,
                Superscript,
                SubScript,
                Highlight,
                TextAlign.configure({
                    types: ["heading", "paragraph"]
                }),
                Image
            ],
            content
        });

        function getHTML(e) {
            return editor.getHTML();
        }

        useImperativeHandle(ref, () => ({
            getHTML
        }));

        return (
            <>
                {label &&
                    <div style={{
                        fontSize: `var(--input-label-size,var(--mantine-font-size-sm))`,
                        fontWeight: 500,
                        marginBottom: '0.5rem'
                    }}>
                        {label}
                    </div>
                }
                <div className={`flex flex-col`}>
                    <MantineRichTextEditor editor={editor} className={`w-full`}>
                        <MantineRichTextEditor.Toolbar sticky stickyOffset={60}>
                            <MantineRichTextEditor.ControlsGroup>
                                <MantineRichTextEditor.Bold/>
                                <MantineRichTextEditor.Italic/>
                                <MantineRichTextEditor.Underline/>
                                <MantineRichTextEditor.Strikethrough/>
                                <MantineRichTextEditor.ClearFormatting/>
                                <MantineRichTextEditor.Highlight/>
                                <MantineRichTextEditor.Code/>
                            </MantineRichTextEditor.ControlsGroup>

                            <MantineRichTextEditor.ControlsGroup>
                                <MantineRichTextEditor.H1/>
                                <MantineRichTextEditor.H2/>
                                <MantineRichTextEditor.H3/>
                                <MantineRichTextEditor.H4/>
                            </MantineRichTextEditor.ControlsGroup>

                            <MantineRichTextEditor.ControlsGroup>
                                <MantineRichTextEditor.Blockquote/>
                                <MantineRichTextEditor.Hr/>
                                <MantineRichTextEditor.BulletList/>
                                <MantineRichTextEditor.OrderedList/>
                                <MantineRichTextEditor.Subscript/>
                                <MantineRichTextEditor.Superscript/>
                            </MantineRichTextEditor.ControlsGroup>

                            <MantineRichTextEditor.ControlsGroup>
                                <MantineRichTextEditor.Link/>
                                <MantineRichTextEditor.Unlink/>
                            </MantineRichTextEditor.ControlsGroup>

                            <MantineRichTextEditor.ControlsGroup>
                                <MantineRichTextEditor.AlignLeft/>
                                <MantineRichTextEditor.AlignCenter/>
                                <MantineRichTextEditor.AlignJustify/>
                                <MantineRichTextEditor.AlignRight/>
                            </MantineRichTextEditor.ControlsGroup>

                            <MantineRichTextEditor.ControlsGroup>
                                <MantineRichTextEditor.Undo/>
                                <MantineRichTextEditor.Redo/>
                            </MantineRichTextEditor.ControlsGroup>

                            <MantineRichTextEditor.ControlsGroup>
                                <button
                                    type="button"
                                    onClick={openImageModal}
                                    className="w-[26px] h-[26px] flex justify-center items-center
                                            rounded-[4px] border-[#9093a4] border p-1"
                                >
                                    <FontAwesomeIcon
                                        icon={faImage}
                                        className="text-[#808496]"
                                    />
                                </button>
                            </MantineRichTextEditor.ControlsGroup>
                        </MantineRichTextEditor.Toolbar>

                        <MantineRichTextEditor.Content/>
                    </MantineRichTextEditor>
                </div>
                <ChooseAttachmentModal
                    isOpen={isAttachmentModalOpened}
                    close={closeAttachmentModal}
                    onChange={({attachUrl}) =>
                        editor
                            .chain()
                            .focus()
                            .setImage({
                                src: attachUrl
                            })
                            .run()
                    }
                    type="image"
                />
            </>
        );
    }
);

export default RichTextInput
