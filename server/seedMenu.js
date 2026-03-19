require("dotenv").config();
const mongoose = require("mongoose");
const Menu = require("./models/Menu");


mongoose.connect(process.env.MONGO_URI);

const menuItems = [
{
 name:"Paneer Tikka",
 category:"Starters",
 image:"https://www.indianveggiedelight.com/wp-content/uploads/2021/08/air-fryer-paneer-tikka-featured.jpg",
 variants:[
  {type:"Half",price:120},
  {type:"Full",price:220}
 ]
},
{
 name:"Afgani Chap",
 category:"Starters",
 image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfWrWgiTBOcpm9gJpj0EguY9cl1GotzdTwOA&s",
 variants:[
  {type:"Half",price:130},
  {type:"Full",price:240}
 ]
},
{
 name:"French Fries",
 category:"Fries",
 price:60,
 image:"https://cdn.britannica.com/34/206334-050-7637EB66/French-fries.jpg"
},
{
 name:"Peri Peri Fries",
 category:"Fries",
 price:70,
 image:"https://fussfreeflavours.com/wp-content/uploads/2022/06/Peri-Peri-Fries-Featured.jpg"
},
{
 name:"Patato Bites",
 category:"Fries",
 price:70,
 image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-nkq2faOOONdYCE8yhNzk5tqRctuuHAMPKA&s"
},
{
 name:"Veg Nuggets",
 category:"Fries",
 price:70,
 image:"https://static.toiimg.com/thumb/84291091.cms?imgsize=407073&width=800&height=800"
},
{
 name:"Coke",
 category:"Drinks",
 price:40,
 image:"https://thumbs.dreamstime.com/b/coca-cola-drink-concept-red-background-cap-bottle-drops-tel-aviv-israel-september-soda-editorial-coke-cold-159732568.jpg"
},
{
 name:"Cold Coffee",
 category:"Drinks",
 price:90,
 image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-mRPlnsIVjVbhHSzTYtDS9hOtta65EItq5A&s"
},



];

async function seed(){

 await Menu.deleteMany()

 await Menu.insertMany(menuItems)

 console.log("Menu Inserted")

 process.exit()

}

seed()