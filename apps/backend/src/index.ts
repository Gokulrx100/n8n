import express, {Request, Response} from "express";
import cors from "cors";

const app = express()
const PORT = 3000;

app.use(express.json());
app.use(cors());

app.post("/user/signup", (req : Request, res : Response) => {
    const {email, password} = req.body;

    
});


app.listen(PORT, ()=>{
    console.log("application is running");
});
