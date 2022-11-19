import { Mail } from "./MailInterface";

export interface mailAddress {
	emails: Array<Mail>,
	address: string,
	index: number,
}