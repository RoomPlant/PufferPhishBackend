import { AuthData } from "../interfaces/AuthDataInterface";
import fs from 'fs'
import { Md5 } from "ts-md5";
import { AES, ɵn } from 'crypto-ts';

class SaveLoadHandler {

	private _path = 'authData.txt';

	private _key = '';

	private _authData = [];

	setKey = async (key: string) => {
		await new Promise((resolve, reject) => {
			fs.readFile(this._path, async (err, data) => {
				if (err) {
					this._authData = [];
					this._key = Md5.hashStr(key);
					resolve('success');
				} else {
					const bytes = await AES.decrypt(data.toString(), Md5.hashStr(key))
					try {
						this._authData = JSON.parse(bytes.toString(ɵn));
						this._key = Md5.hashStr(key);
						resolve('success');
					} catch (error) {
						console.log(error)
						reject('wrong key')
					}
				}
			})
		})
	}

	getKey = () => {
		return this._key;
	}

	saveAuthData = (authData: AuthData[]) => {
		const data = AES.encrypt(JSON.stringify(authData), this._key).toString();
		if (authData.length) {
			fs.writeFile(this._path, data, (err) => {
				err && console.log(err);
			})
		} else {
			fs.rm(this._path, (err) => {
				err && console.log(err);
			})
		}
	};

	authData = () => {
		return this._authData
	}
}

const saveLoadHandler = new SaveLoadHandler;

export const saveData = saveLoadHandler.saveAuthData;
export const authData = saveLoadHandler.authData;
export const getKey = saveLoadHandler.getKey;
export const setKey = saveLoadHandler.setKey;
