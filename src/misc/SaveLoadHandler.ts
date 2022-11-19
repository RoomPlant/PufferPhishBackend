import { AuthData } from "../interfaces/AuthDataInterface";
import fs from 'fs'

class SaveLoadHandler {
	saveAuthData = (authData: AuthData[]) => {
		const json = JSON.stringify(authData);
		fs.writeFile("authData.txt", json, (err) => {
			err && console.log(err);
		})
	}

	loadAuthData = async () => {
		let loadedData: AuthData[] = [];
		await new Promise((resolve, reject) => {
			fs.readFile('authData.txt', (err, data) => {
				if (err) {
					console.log(err)
				} else {
					loadedData = JSON.parse(data.toString())
					resolve('success')
				}
			})
		})
		return loadedData;
	}
}

const saveLoadHandler = new SaveLoadHandler;

export const saveData = saveLoadHandler.saveAuthData;
export const loadData = saveLoadHandler.loadAuthData;