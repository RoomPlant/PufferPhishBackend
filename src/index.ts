import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import json from 'koa-json';
import cors from 'koa2-cors';
import api from './router/mailRouter';

const app = new Koa();

app.use(json());

app.use(bodyParser());
app.use(cors({
	origin: "http://localhost:3000"
}));

app.use(api.routes());

app
	.listen(3030, () =>
		console.log("Server is running on port 3030")
	)
	.on('error', err =>
		console.log(err)
	);
