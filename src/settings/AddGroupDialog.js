// @flow
import m from "mithril"
import {lang} from "../misc/LanguageViewModel"
import {assertMainOrNode} from "../api/Env"
import {TextField} from "../gui/base/TextField"
import {GroupType} from "../api/common/TutanotaConstants"
import {Dialog} from "../gui/base/Dialog"
import {SelectMailAddressForm} from "./SelectMailAddressForm"
import {worker} from "../api/main/WorkerClient"
import {DropDownSelector} from "../gui/base/DropDownSelector"
import {getGroupTypeName} from "./GroupViewer"
import * as AddUserDialog from "./AddUserDialog"

assertMainOrNode()

export function show(): Promise<void> {
	return AddUserDialog.getAvailableDomains().then(availableDomains => {

		let typeField = new DropDownSelector("groupType_label", null, [GroupType.Mail].map(t => {
			return {name: getGroupTypeName(t), value: t}
		}), GroupType.Mail)

		let nameField = new TextField("name_label")
		let mailAddressForm = new SelectMailAddressForm(availableDomains)
		let form = {
			view: () => {
				return [
					m(typeField),
					m(nameField),
					(typeField.selectedValue() == GroupType.Mail) ? m(mailAddressForm) : m(""),
				]
			}
		}

		return Dialog.smallDialog(lang.get("addGroup_label"), form, () => {
			if (typeField.selectedValue() == GroupType.Mail) {
				return mailAddressForm.getErrorMessageId()
			} else if (typeField.selectedValue() == GroupType.Team && nameField.value().trim() == "") {
				return "enterName_msg"
			} else {
				return null
			}
		}).then(okClicked => {
			if (okClicked) {
				if (typeField.selectedValue() == GroupType.Mail) {
					return Dialog.progress("pleaseWait_msg", worker.createMailGroup(nameField.value(), mailAddressForm.getCleanMailAddress()))
				} else {
					return Dialog.progress("pleaseWait_msg", worker.createTeamGroup(nameField.value()))
				}
			}
		})
	})
}