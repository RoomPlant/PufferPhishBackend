import Imap from 'imap-simple';
import Analizer from './analizer';
import { Config } from "imap"
import { Mail } from '../interfaces/MailInterface';
import { AuthData } from '../interfaces/AuthDataInterface';


const mailContentDecryption = (rawContent: string) => {
	const regexp = /--===============\d*==\r\nContent-Type: text\/\w*; charset=\"utf-8\"\r\nMIME-Version: 1.0\r\nContent-Transfer-Encoding: base64/
	if (rawContent.match(regexp)) {
		const content = rawContent.split(regexp)[1];
		return Buffer.from(content, 'base64').toString();
	}
	return rawContent
}

class MailBox {
	private _login;
	private _passwd;
	private _mailDomain;
	private _host;
	private _config: Config;
	private _messages: Mail[] = [];
	private _startingNumber = 0;
	private _endingNumber = 0;
	private _diff = 1;
	private _mailInitNumber = 0;
	private _mailCurrentNumber = 0;
	private _Analizer = new Analizer;

	constructor({ login, passwd }: AuthData) {
		this._login = login;
		this._passwd = passwd;
		this._mailDomain = login.split("@")[1];
		this._host = this._mailDomain === "outlook.com" ? "outlook.office365.com" : "imap." + this._mailDomain;
		this._config = {
			user: this._login,
			password: this._passwd,
			host: this._host,
			port: 993,
			tls: true,
			authTimeout: 60000,
			tlsOptions: { rejectUnauthorized: false }
		}
	}

	areAllMailsLoaded = () => {
		return this._endingNumber === 1 ? true : false
	}

	refreshMails = async () => {
		const connection = await Imap.connect({
			imap: this._config
		});
		return new Promise((resolve, reject) => {
			connection.openBox('INBOX', async (err: Error, INBOX: any) => {
				if (this._mailCurrentNumber < INBOX.messages.total) {
					const searchCriteria = [this._mailCurrentNumber + 1 + ':*'];
					const fetchOptions = {
						bodies: ['HEADER', 'TEXT', ''],
					};
					this._mailCurrentNumber = INBOX.messages.total;
					await connection.search(searchCriteria, fetchOptions).then(messages => {
						messages.map(mail => {
							this._messages.unshift({
								sender: mail.parts[0].body.from,
								subject: mail.parts[0].body.subject,
								date: new Date(mail.attributes.date).toLocaleString(),
								content: mailContentDecryption(mail.parts[1].body),
								uid: mail.attributes.uid,
								isPassed: this._Analizer.analize(mail)
							})
						})
					})
					connection.end();
					resolve("all fetched")
				} else resolve("nothing new")
			})
		})
	}

	receiveMails = async () => {
		const connection = await Imap.connect({
			imap: this._config
		});
		return new Promise((resolve, reject) => {
			connection.openBox('INBOX', async (err: Error, INBOX: any) => {
				if (this._diff === 1) {
					this._mailInitNumber = INBOX.messages.total;
					this._mailCurrentNumber = INBOX.messages.total;
				}
				this._startingNumber = this._mailInitNumber - 25 * (this._diff - 1);
				this._endingNumber = (this._startingNumber - 25 > 1) ? this._startingNumber - 25 + 1 : 1;
				const searchCriteria = [this._endingNumber + ':' + this._startingNumber];
				const fetchOptions = {
					bodies: ['HEADER', 'TEXT', ''],
				};

				await connection.search(searchCriteria, fetchOptions).then(messages => {
					this._messages = this._messages.concat(messages.reverse().map(mail => (
						{
							sender: mail.parts[0].body.from,
							subject: mail.parts[0].body.subject,
							date: new Date(mail.attributes.date).toLocaleString(),
							content: mailContentDecryption(mail.parts[1].body),
							uid: mail.attributes.uid,
							isPassed: this._Analizer.analize(mail)
						}
					)));
					this._diff++;
					connection.end();
					resolve("all fetched");
				})
			})
		})
	}

	get login() {
		return this._login
	}

	get messages() {
		return this._messages
	}

	get passwd() {
		return this._passwd
	}
}

export default MailBox;