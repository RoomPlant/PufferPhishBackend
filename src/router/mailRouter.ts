import Router from "koa-router";
import { Context } from "koa";
import MailBox from "../Email/imap";
import { mailAddress } from "../interfaces/MailAddressInterface";
import { loadData, saveData } from "../misc/SaveLoadHandler";

const router = new Router();

let addressList: MailBox[] = [];

router.post('/mailAuth', async (ctx: Context) => {
	const index = addressList.push(new MailBox(await ctx.request.body)) - 1;
	try {
		for (let i = 0; i < index; i++) {
			if (addressList[i].login === addressList[index].login) {
				throw "same mail address"
			}
		}
		await addressList[index].receiveMails();
		console.log("success");
		saveData(addressList.map(address => ({
			login: address.login,
			passwd: address.passwd
		})))
		ctx.body = {
			result: "success",
			index: index,
			address: addressList[index].login
		};
	} catch (err) {
		addressList.splice(-1, 1)
		console.log(err);
		ctx.body = {
			result: "error"
		};
	}
});

router.post('/loadMails', async (ctx: Context) => {
	if (addressList[await ctx.request.body.index].areAllMailsLoaded()) {
		ctx.body = "finished";
	} else {
		await addressList[await ctx.request.body.index].receiveMails();
		ctx.body = addressList[await ctx.request.body.index].messages;
	};
});

router.post('/refreshMails', async (ctx: Context) => {
	await addressList[await ctx.request.body.index].refreshMails()
	ctx.body = addressList[await ctx.request.body.index].messages;
});

router.post('/checkAuth', async (ctx: Context) => {
	const mailAdresses: mailAddress[] = [];
	if (!addressList.length) {
		const loadedData = await loadData();
		addressList = await Promise.all(loadedData.map(async (authData) => {
			const mailAddress = new MailBox(authData);
			await mailAddress.receiveMails();
			return mailAddress
		}))
	}
	addressList.forEach((address, index) => {
		mailAdresses.push({
			index: index,
			address: address.login,
			emails: address.messages,
		})
	})
	ctx.body = mailAdresses;
});

router.post('/deleteMailBox', async (ctx: Context) => {
	try {
		const index = await ctx.request.body.index
		addressList.splice(index, 1);
		saveData(addressList.map(address => ({
			login: address.login,
			passwd: address.passwd
		})))
		ctx.body = {
			result: 'success',
			index: index
		};
	} catch (err) {
		console.log(err);
		ctx.body = 'error';
	}

})

router.post('/getMail', async (ctx: Context) => {
	ctx.body = addressList[await ctx.request.body.index].messages;
});

export default router;