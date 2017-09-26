// @flow
import m from "mithril"
import {assertMainOrNode} from "../api/Env"
import {Dialog} from "../gui/base/Dialog"
import {lang} from "../misc/LanguageViewModel"
import {update} from "../api/main/Entity"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {EmailSignatureType} from "../api/common/TutanotaConstants"
import {neverNull} from "../api/common/utils/Utils"
import {logins} from "../api/main/LoginController"
import {getDefaultSignature} from "../mail/MailUtils"
import {HtmlEditor} from "../gui/base/HtmlEditor"

assertMainOrNode()

export function show() {
	let currentCustomSignature = logins.getUserController().props.customEmailSignature
	if (currentCustomSignature == "") {
		currentCustomSignature = getDefaultSignature()
	}

	let previousType = logins.getUserController().props.emailSignatureType
	let editor = new HtmlEditor().showBorders().setMinHeight(200).setValue(getSignature(previousType, currentCustomSignature))

	let typeField = new DropDownSelector("userEmailSignature_label", null, getSignatureTypes(), previousType)
	typeField.selectedValue.map(type => {
		if (previousType == EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
			currentCustomSignature = editor.getValue()
		}
		previousType = type
		editor.setValue(getSignature(type, currentCustomSignature))
		editor.setEnabled(type == EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM)
	})

	let form = {
		view: () => {
			return [
				m(typeField),
				m(".small.mt-form", lang.get("preview_label")),
				m(editor),
			]
		}
	}
	return Dialog.smallDialog(lang.get("userEmailSignature_label"), form).then(okClicked => {
		if (okClicked) {
			logins.getUserController().props.emailSignatureType = typeField.selectedValue()
			if (typeField.selectedValue() == EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
				logins.getUserController().props.customEmailSignature = editor.getValue()
			}
			update(logins.getUserController().props)
		}
	})
}

export function getSignatureTypes(): {name: string, value: string}[] {
	return [
		{name: lang.get("emailSignatureTypeDefault_msg"), value: EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT},
		{name: lang.get("emailSignatureTypeCustom_msg"), value: EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM},
		{name: lang.get("comboBoxSelectionNone_msg"), value: EmailSignatureType.EMAIL_SIGNATURE_TYPE_NONE},
	]
}

export function getSignatureType(props: TutanotaProperties): {name: string, value: string} {
	return neverNull(getSignatureTypes().find(t => t.value == props.emailSignatureType))
}

function getSignature(type: string, currentCustomSignature: string): string {
	if (type == EmailSignatureType.EMAIL_SIGNATURE_TYPE_DEFAULT) {
		return getDefaultSignature()
	} else if (type == EmailSignatureType.EMAIL_SIGNATURE_TYPE_CUSTOM) {
		return currentCustomSignature
	} else {
		return ""
	}
}