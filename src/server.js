const express = require('express');

const app =express();
const PORT= process.env.PORT || 5000;

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('listening on port 5000');
})

app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})