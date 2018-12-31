//express_demo.js 文件
var express = require('express');
var graphqlHTTP = require('express-graphql');
var bodyParser = require('body-parser');
const path = require('path');
var formidable = require('formidable');
var graphql = require('graphql');
var schema = require('./schema');
var { buildSchema } = require('graphql');
var app = express();
var router = express.Router();
//app.use('F:\\msNode\\static', express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));
//app.use(bodyParser.urlencoded({ extended: true}));
//app.use(bodyParser.text({ type: 'application/graphql' }));
//var netutil = require("./netutil.js");
const Sequelize = require('sequelize');

const config = require("./config.json");
const aes = require("./aes");


app.get('/', function (req, res) {
  res.header("Access-Control-Allow-Origin","*");
  res.send('Hello World');
});

app.post('/graphql', function (req, res) {
  graphql.graphql(schema.default, req.body)
  .then((result) => {
    res.send(JSON.stringify(result, null, 2));
  }).catch((e)=>{
    console.log(e);
  });
});

function createToken(userId){
  let time = Math.round(new Date().getTime()/1000);
  //let originData = [userId,time].join("#");
  let originData = JSON.stringify({userId,time});
  console.log(originData);
  let token = aes.encrypt_128_cbc(originData,config.tokenKey,config.tokenIv);
  console.log(token);
  return token;
}

function validateToken(token){
  if(token==undefined || token=="")
    return undefined;

  console.log("validateToken",token,decodeURIComponent(token));
  try{
    let originData = aes.decrypt_128_cbc(decodeURIComponent(token),config.tokenKey,config.tokenIv);
    /*
    let datas = originData.split("#");
    if(datas.length!=2){
      return undefined;
    }
    let time = datas[1];
    */
    let datas = JSON.parse(originData);
    
    let now = Math.round(new Date().getTime()/1000);
    if(datas.time==undefined || now - datas.time>config.sessionTimeout)
      return undefined;
    return datas;
  }catch(e){
    console.log("validateToken",e.message);
    return undefined;
  }
}

app.post('/msServer/login', function (req, res) {
  var form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.uploadDir = config.imageUploadDir;
  form.maxFileSize  = config.imageUploadMaxSize;
  let tmpFiles = {};
  form.parse(req, function(err, fields, files) {
    let userName = fields.userName;
    let password = fields.password;
    console.log(fields,userName,password);
    if(userName==undefined || userName=="" || password==undefined || password==""){
      res.send({error:"参数错误"});
      return; 
    }
    SysUsers.findOne({
      where:{
        userName:userName,
        password:password,
      }
    }).then((result)=>{
      
      if(result==null){
        res.send({
          error:"账号或密码错误",
        });
      }else{
        console.log("result:",result.toJSON());
        let user = result.toJSON();
        res.send({
          token:createToken(user.id),
        });
      }
    }).catch((e)=>{
      console.log("e",e.message);
      throw(new Error(e.message));
    });
  });
});

function delay(t){
  console.log("delay begin",t);
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      console.log("delay over");
      resolve(t);
    },t);
  });
}

const Op = Sequelize.Op;
const operatorsAliases = {
  $eq: Op.eq,
  $ne: Op.ne,
  $gte: Op.gte,
  $gt: Op.gt,
  $lte: Op.lte,
  $lt: Op.lt,
  $not: Op.not,
  $in: Op.in,
  $notIn: Op.notIn,
  $is: Op.is,
  $like: Op.like,
  $notLike: Op.notLike,
  $iLike: Op.iLike,
  $notILike: Op.notILike,
  $regexp: Op.regexp,
  $notRegexp: Op.notRegexp,
  $iRegexp: Op.iRegexp,
  $notIRegexp: Op.notIRegexp,
  $between: Op.between,
  $notBetween: Op.notBetween,
  $overlap: Op.overlap,
  $contains: Op.contains,
  $contained: Op.contained,
  $adjacent: Op.adjacent,
  $strictLeft: Op.strictLeft,
  $strictRight: Op.strictRight,
  $noExtendRight: Op.noExtendRight,
  $noExtendLeft: Op.noExtendLeft,
  $and: Op.and,
  $or: Op.or,
  $any: Op.any,
  $all: Op.all,
  $values: Op.values,
  $col: Op.col
};
const sequelize = new Sequelize(config.dbName, config.dbUser, config.dbPass, {
  host: config.dbIp,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
  operatorsAliases,
});


let SequelizeObjects = {};

const Comments = sequelize.define('comment', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  articleId: Sequelize.INTEGER,
  content: Sequelize.STRING,
  commentator: Sequelize.INTEGER,
  becommentator: Sequelize.INTEGER,
  createdAt: Sequelize.STRING,
});

SequelizeObjects["comment"] = Comments;

const Articles = sequelize.define('articles', {
  //autoIncrement 让create函数返回新记录的id值
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  title: Sequelize.STRING,
  listImg: Sequelize.STRING,
  summary: Sequelize.STRING,
  content: Sequelize.STRING,
  authorId: Sequelize.INTEGER,
  tags: Sequelize.STRING,
  createdAt: Sequelize.DATE,
});

SequelizeObjects["articles"] = Articles;

const Users = sequelize.define('users', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  nickname: Sequelize.STRING,
  introduce: Sequelize.STRING,
  birthday: Sequelize.DATE,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});

SequelizeObjects["users"] = Users;

const SysUsers = sequelize.define('sys_users', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  name: Sequelize.STRING,
  password: Sequelize.STRING,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});

SequelizeObjects["sys_users"] = SysUsers;

const SysRoles = sequelize.define('sys_roles', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  name: Sequelize.STRING,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});
SequelizeObjects["sys_roles"] = SysRoles;

const SysUserRoles = sequelize.define('sys_user_roles', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  userid: Sequelize.INTEGER,
  roleid: Sequelize.INTEGER,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});


const SysPrivsTable = sequelize.define('sys_privs_tables', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  roleid: Sequelize.INTEGER,
  tableName: Sequelize.STRING,
  tablePriv: Sequelize.STRING,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});
const SysPrivsColumn = sequelize.define('sys_privs_columns', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  roleid: Sequelize.INTEGER,
  tableName: Sequelize.STRING,
  columnName: Sequelize.STRING,
  columnPriv: Sequelize.STRING,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});

const Menus = sequelize.define('menus', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  name: Sequelize.STRING,
  ordernum: Sequelize.INTEGER,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});
SequelizeObjects["menus"] = Menus;

const Charges = sequelize.define('charges', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  name: Sequelize.STRING,
  price: Sequelize.FLOAT,
  createdAt: Sequelize.DATE,
  updatedAt: Sequelize.DATE,
});

SequelizeObjects["charges"] = Charges;

const Skus = sequelize.define('skus', {
  id: {type:Sequelize.STRING,primaryKey: true, autoIncrement: true},
  menu: Sequelize.INTEGER,
  name: Sequelize.STRING,
  image: Sequelize.STRING,
  monthSale: Sequelize.INTEGER,
  smallCupPrice: Sequelize.FLOAT,
  midleCupPrice: Sequelize.FLOAT,
  bigCupPrice: Sequelize.FLOAT,
  charge: Sequelize.STRING,
  taste: Sequelize.STRING,
  temp: Sequelize.STRING,
});
SequelizeObjects["skus"] = Skus;


async function getCommentsByArticleId(articleId){
  let rawComments = await Comments.findAll({
    where:{
      articleId:articleId
    }
  });
  let comments=[];
  for(let i in rawComments){
    let comment = rawComments[i].toJSON();
    comments.push(comment);
  }
  return comments;
}

async function getArticleById({id}){
  //console.log("args:",args);
  //console.log("obj:",obj);
  //console.log("content:",content);
  //let id=args.id;
  let article = await Articles.findOne({
    where:{
      id:id
    }
  });
  if(article!=undefined){
    article=article.toJSON();
    article.comments= await getCommentsByArticleId(id);
  }
  return article;
}

async function getAuthorById(id){
  console.log("getAuthorById:",id);
  let author = await Users.findOne({
    where:{
      id:id
    }
  });
  //console.log(author);
  if(author!=undefined)
    author = author.toJSON();
  return author;
}

function isInArray(value,arr){
  for(let i in arr){
    if(value==arr[i])
      return true;
  }
  return false;
}

let articleTags = ["腾讯","科技","AI","区块链","股价"];
async function getArticles({where,limit,offset}){
  /*
  let items=[];
  for(let art in articles){
    items.push(articles[art]);
  }
  return items;
  */
  let options={};
  if(where!=undefined){
    let whereObj = JSON.parse(where);
    options["where"]=whereObj;
  }
  if(limit!=undefined && offset!=undefined){
    options["limit"]=limit;
    options["offset"]=offset;
  }
  let articles = await Articles.findAll(options);
  
  let frontArticles=[];
  for(let i in articles){
    let article = articles[i].toJSON();
    frontArticles.push(article);

    let author = await getAuthorById(article.authorId);
    article.author=author;

    //组装前端多选框
    console.log(article.tags);
    let tags = article.tags.split(",");
    let frontTags=[];
    for(let i in articleTags){
      let tag=articleTags[i];
      let frontTag = {
        name:tag,
        value:tag,
      };
      if(isInArray(tag,tags)){
        frontTag.checked=true;
      }
      frontTags.push(frontTag);
    }
    article.tags=JSON.stringify(frontTags);
    console.log("getCommentsByArticleId",article.id);
    article.comments= await getCommentsByArticleId(article.id);
  }
  return {articles:frontArticles,count:frontArticles.length};
}



async function insertArticle({item}) {
    let articleObj = JSON.parse(item);
    let result = await Articles.create(articleObj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteArticle({where}) {
    let whereObj = JSON.parse(where);
    let result = await Articles.destroy({where:whereObj});
    return result;
}
async function updateArticle({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await Articles.update(updateObj,{where:whereObj});
    let article = await getArticleById({id:whereObj.id});
    return article;
}

async function getUsers({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  console.log(tokenResult);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  console.log("getUsers:",token,where);
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await Users.findAndCountAll(options);
  
  let frontItems=[];
  for(let i in result.rows){
    let item = result.rows[i].toJSON();
    frontItems.push(item);
  }
  return {users:frontItems,count:result.count};
}

async function getUserById({id}){
  let user = await Users.findOne({
    where:{
      id:id
    }
  });
  if(user!=undefined){
    user=user.toJSON();
  }
  return user;
}

async function insertUser({item}) {
    let userObj= JSON.parse(item);
    let result = await Users.create(userObj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteUser({where}) {
    let whereObj = JSON.parse(where);
    let result = await Users.destroy({where:whereObj});
    return result;
}
async function updateUser({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await Users.update(updateObj,{where:whereObj});
    let user = await getUserById({id:whereObj.id});
    return user;
}


async function getSysUsers({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await SysUsers.findAndCountAll(options);
  
  let frontItems=[];
  for(let i in result.rows){
    let item = result.rows[i].toJSON();
    frontItems.push(item);
  }
  return {sysUsers:frontItems,count:result.count};
}

async function getSysUserById({id}){
  let sysuser = await SysUsers.findOne({
    where:{
      id:id
    }
  });
  if(sysuser!=undefined){
    sysuser=sysuser.toJSON();
  }
  return sysuser;
}

async function insertSysUser({item}) {
  console.log("insertSysUser:",item);
  let userObj= JSON.parse(item);
  let result = await SysUsers.create(userObj);
  let newOne = result.toJSON();
  return newOne.id;
}
async function deleteSysUser({where}) {
    let whereObj = JSON.parse(where);
    let result = await SysUsers.destroy({where:whereObj});
    return result;
}
async function updateSysUser({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await SysUsers.update(updateObj,{where:whereObj});
    let sysuser = await getSysUserById({id:whereObj.id});
    return sysuser;
}

async function getSysRoles({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  console.log(tokenResult);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await SysRoles.findAndCountAll(options);
  
  let frontItems=[];
  for(let i in result.rows){
    let item = result.rows[i].toJSON();
    frontItems.push(item);
  }
  return {sysRoles:frontItems,count:result.count};
}

async function getSysRoleById({id}){
  let sysRole = await SysRoles.findOne({
    where:{
      id:id
    }
  });
  if(sysRole!=undefined){
    sysRole=sysRole.toJSON();
  }
  return sysRole;
}

async function insertSysRole({item}) {
    let itemObj= JSON.parse(item);
    let result = await SysRoles.create(itemObj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteSysRole({where}) {
    let whereObj = JSON.parse(where);
    let result = await SysRoles.destroy({where:whereObj});
    return result;
}
async function updateSysRole({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await SysRoles.update(updateObj,{where:whereObj});
    let sysRole = await getSysRoleById({id:whereObj.id});
    return sysRole;
}

async function getSysUserRoles({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>1000){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);
  
  let sql = "SELECT ur.*,u.name as userName,r.name as roleName FROM mstemplate.sys_user_roles as ur inner join sys_users as u on(ur.userid=u.id) inner join sys_roles as r on(ur.roleid=r.id) order by u.id,r.id;";

  let rows = await query(sql,{ type: sequelize.QueryTypes.SELECT});
  return {sysUserRoles:rows,count:rows.length};
}

async function query(sql, option){
  return new Promise((resolve,reject)=>{
    sequelize.query(sql,option).then((items) => {
      resolve(items);
    }).catch((e)=>{
      reject(e);
    });
  });
}

async function getSysUserRoleById({id}){
  let item = await SysUserRoles.findOne({
    where:{
      id:id
    }
  });
  if(item!=undefined){
    item=item.toJSON();
  }
  return item;
}

async function insertSysUserRole({item}) {
  console.log("insertSysUserRole:",item);
  let itemObj= JSON.parse(item);
  let result = await SysUserRoles.create(itemObj);
  let newOne = result.toJSON();
  console.log(newOne);
  return newOne.id;
}
async function deleteSysUserRole({where}) {
    let whereObj = JSON.parse(where);
    let result = await SysUserRoles.destroy({where:whereObj});
    return result;
}
async function updateSysUserRole({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await SysUserRoles.update(updateObj,{where:whereObj});
    let item = await getSysUserRoleById({id:whereObj.id});
    return item;
}

async function getSysPrivsColumns({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  console.log(tokenResult);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>1000){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await SysPrivsColumn.findAndCountAll(options);
  
  let frontItems=[];
  for(let i in result.rows){
    let item = result.rows[i].toJSON();
    frontItems.push(item);
  }
  return {sysPrivsColumns:frontItems,count:result.count};
}

async function getSysPrivsColumnById({id}){
  let item = await SysPrivsColumn.findOne({
    where:{
      id:id
    }
  });
  if(item!=undefined){
    item=item.toJSON();
  }
  return item;
}

async function insertSysPrivsColumn({item}) {
    let itemObj= JSON.parse(item);
    let result = await SysPrivsColumn.create(itemObj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteSysPrivsColumn({where}) {
    let whereObj = JSON.parse(where);
    console.log("deleteSysPrivsColumn:", whereObj);
    let result = await SysPrivsColumn.destroy({where:whereObj});
    return result;
}
async function updateSysPrivsColumn({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    console.log("updateSysPrivsColumn:",updateObj,whereObj);
    await SysPrivsColumn.update(updateObj,{where:whereObj});
    let item = await getSysPrivsColumnById({id:whereObj.id});
    return item;
}

async function getSysPrivsTables({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  console.log(tokenResult);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>1000){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await SysPrivsTable.findAndCountAll(options);
  
  let frontItems=[];
  for(let i in result.rows){
    let item = result.rows[i].toJSON();
    frontItems.push(item);
  }
  return {sysPrivsTables:frontItems,count:result.count};
}

async function getSysPrivsTableById({id}){
  let item = await SysPrivsTable.findOne({
    where:{
      id:id
    }
  });
  if(item!=undefined){
    item=item.toJSON();
  }
  return item;
}

async function insertSysPrivsTable({item}) {
    let itemObj= JSON.parse(item);
    let result = await SysPrivsTable.create(itemObj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteSysPrivsTable({where}) {
    let whereObj = JSON.parse(where);
    let result = await SysPrivsTable.destroy({where:whereObj});
    return result;
}
async function updateSysPrivsTable({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await SysPrivsTable.update(updateObj,{where:whereObj});
    let item = await getSysPrivsTableById({id:whereObj.id});
    return item;
}

async function getUserPrivs(userId){
  let privs = {};
  let tablePrivSql = `SELECT pt.tableName,pt.tablePriv FROM sys_user_roles as ur inner join sys_privs_tables as pt on(ur.roleid=pt.roleid) where ur.userid=${userId}`;
  let tablePrivs = await query(tablePrivSql,{ type: sequelize.QueryTypes.SELECT});
  for(let i in tablePrivs){
    let priv = tablePrivs[i];
    let item = {
      tablePrivs:{},
      columnPrivsMap:{
        "Insert":{},
        "Update":{},
      },
      columnPrivsArray:{
        "Select":[],
        "Insert":[],
        "Update":[],
      },
    };
    operaActionArr = priv.tablePriv.split(",");
    operaActionArr .forEach((operaAction)=>{
      item.tablePrivs[operaAction]=1;
    });
    privs[priv.tableName]=item;
  }
  let columnPrivSql = `SELECT pc.tableName,pc.columnName,pc.columnPriv FROM sys_user_roles as ur inner join sys_privs_columns as pc on(ur.roleid=pc.roleid) where ur.userid=${userId};`;
  let columnbPrivs = await query(columnPrivSql,{ type: sequelize.QueryTypes.SELECT});
  for(let i in columnbPrivs){
    let priv = columnbPrivs[i];
    let tableName = priv.tableName;
    let columnName = priv.columnName;
    let item = privs[tableName];
    if(item==undefined){
      item = {
        tablePrivs:{},
        columnPrivsMap:{
          "Insert":{},
          "Update":{},
        },
        columnPrivsArray:{
          "Select":[],
          "Insert":[],
          "Update":[],
        },
      };
    }
    operaActionArr = priv.columnPriv.split(",");
    operaActionArr.forEach((operaAction)=>{
      if(operaAction=="Select"){
        item.columnPrivsArray.Select.push(columnName); 
      }else if(operaAction=="Insert"){
        item.columnPrivsArray.Insert.push(columnName); 
        item.columnPrivsMap.Insert[columnName]=1; 
      }else if(operaAction=="Update"){
        item.columnPrivsArray.Update.push(columnName); 
        item.columnPrivsMap.Update[columnName]=1; 
      }else{
        console.log("error row:",priv);
      }
    });
    privs[priv.tableName]=item;
  }
  return privs;
}

//根据用户的权限返回表的字段数组作为attributs
function checkPrivs(privs,tableName,operate){
  let tablePrivs = privs[tableName];
  if(tablePrivs==undefined){
      return {permit:"none"}
  }
  if(operate=="select"){
    if(tablePrivs.tablePrivs.Select==1){
      return {permit:"all"}
    }else if(tablePrivs.columnPrivsArray.Select.length!=0){
      return {permit:"part",attributes:tablePrivs.columnPrivsArray.Select}
    }else{
      return {permit:"none"}
    }
  }else if(operate=="insert"){
    if(tablePrivs.tablePrivs.Insert==1){
      return {permit:"all"}
    }else if(tablePrivs.columnPrivsArray.Insert.length!=0){
      return {permit:"part",attributesMap:tablePrivs.columnPrivsMap.Insert}
    }else{
      return {permit:"none"}
    }
  }else if(operate=="update"){
    if(tablePrivs.tablePrivs.Update==1){
      return {permit:"all"}
    }else if(tablePrivs.columnPrivsArray.Update.length!=0){
      return {permit:"part",attributesMap:tablePrivs.columnPrivsMap.Update}
    }else{
      return {permit:"none"}
    }
  }else if(operate=="delete"){
    if(tablePrivs.tablePrivs.Delete==1){
      return {permit:"all"}
    }else{
      return {permit:"none"};
    }
  }else{
    console.log("checkPrivs unknow operate: "+operate);
    return {permit:"none"};
  }
}

async function getMenus({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    console.log("invalid token");
    throw new Error("invalid token");
  }
  console.log(tokenResult);
  let userId = tokenResult.userId;
  let privs = await getUserPrivs(userId);
  let attributes = checkPrivs(privs,"menu","select");
  console.log("attributes:",attributes);

  let options={};
  console.log("getMenus:",token,where);
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);
  options["attributes"]= ['id','ordernum'];

  //let users = await Users.findAll(options);
  let result = await Menus.findAndCountAll(options);
  
  let frontMenus=[];
  for(let i in result.rows){
    let menu = result.rows[i].toJSON();
    console.log(menu);

    //查找主菜单关联的单品
    menu.skus = await getSkusByMenuId(menu.id);

    delete menu.ordernum;

    frontMenus.push(menu);
  }
  return {menus:frontMenus,count:result.count};
}

async function getMenuById({id}){
  let menu = await Menus.findOne({
    where:{
      id:id
    }
  });
  if(menu!=undefined){
    menu=menu.toJSON();
  }
  return menu;
}

async function insertMenu({item}) {
    let obj = JSON.parse(item);
    let result = await Menus.create(obj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteMenu({where}) {
    let whereObj = JSON.parse(where);
    let result = await Menus.destroy({where:whereObj});
    return result;
}

async function updateMenu({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await Menus.update(updateObj,{where:whereObj});
    let menu = await getMenuById({id:whereObj.id});
    return menu;
}

async function getCharges({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let options={};
  console.log("getCharges:",token,where);
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await Charges.findAndCountAll(options);
  
  let frontCharges=[];
  for(let i in result.rows){
    let charge = result.rows[i].toJSON();
    frontCharges.push(charge);
  }
  return {charges:frontCharges,count:result.count};
}

async function getChargeById({id}){
  let charge = await Charges.findOne({
    where:{
      id:id
    }
  });
  if(charge!=undefined){
    charge=charge.toJSON();
  }
  return charge;
}

async function insertCharge({item}) {
    let obj = JSON.parse(item);
    let result = await Charges.create(obj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteCharge({where}) {
    let whereObj = JSON.parse(where);
    let result = await Charges.destroy({where:whereObj});
    return result;
}

async function updateCharge({update,where}) {
    let updateObj = JSON.parse(update);
    let whereObj = JSON.parse(where);
    await Charges.update(updateObj,{where:whereObj});
    let charge = await getChargeById({id:whereObj.id});
    return charge;
}

async function getSkus({token, where, currentPage, pageSize}){
  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let privs = await getUserPrivs(userId);
  let privResult = checkPrivs(privs,"skus","select");
  console.log("getSkus attributes:",privResult);
  if(privResult.permit=="none"){
    throw new Error("没有权限");
  }
  let options={};

  if(privResult.permit=="part"){
    options["attributes"] = privResult.attributes;
  }

  console.log("getSkus:",token,where);
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await Skus.findAndCountAll(options);
  
  let frontSkus=[];
  for(let i in result.rows){
    let sku = result.rows[i].toJSON();
    frontSkus.push(sku);
  }
  return {skus:frontSkus,count:result.count};
}

async function getSkuById({token,id}){
  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;
  console.log("getSkuById:",userId);

  let privs = await getUserPrivs(userId);
  let privResult = checkPrivs(privs,"skus","insert");
  console.log("getSkus attributes:",privResult);
  if(privResult.permit=="none"){
    throw new Error("没有权限");
  }
  let options={};

  if(privResult.permit=="part"){
    options["attributes"] = privResult.attributes;
  }

  options["where"] = {
    id:id
  };

  let sku = await Skus.findOne(options);
  if(sku!=undefined){
    sku=sku.toJSON();
  }
  return sku;
}

async function getSkusByMenuId(token,id){
  let rawDatas = await Skus.findAll({
    where:{
      menu:id
    }
  });
  let datas=[];
  for(let i in rawDatas){
    let data = rawDatas[i].toJSON();
    datas.push(data);
  }
  return datas;
}

async function insertSku({token,item}) {
    let obj = JSON.parse(item);

    let tokenResult = validateToken(token);
    if(tokenResult==undefined){
      //graphql使用抛出异常的方式将错误返给接口调用方
      throw new Error("invalid token");
    }
    let userId = tokenResult.userId;

    let privs = await getUserPrivs(userId);
    let privResult = checkPrivs(privs,"skus","insert");
    console.log("getSkus attributes:",privResult);
    if(privResult.permit=="none"){
      throw new Error("没有权限");
    }
    let options={};

    if(privResult.permit=="part"){
      let attributesMap = privResult.attributesMap;
      for(let filed in obj){
        if(attributesMap[filed]==undefined){
          throw new Error("没有权限,filed:"+filed);
        }
      }
    }
    let result = await Skus.create(obj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteSku({token, where}) {
    let whereObj = JSON.parse(where);

    let tokenResult = validateToken(token);
    if(tokenResult==undefined){
      //graphql使用抛出异常的方式将错误返给接口调用方
      throw new Error("invalid token");
    }
    let userId = tokenResult.userId;

    let privs = await getUserPrivs(userId);
    let privResult = checkPrivs(privs,"skus","delete");
    console.log("deleteSku attributes:",privResult);
    if(privResult.permit!="all"){
      throw new Error("没有权限");
    }
    let result = await Skus.destroy({where:whereObj});
    return result;
}

async function updateSku({token, update,where}) {
    let updateObj = JSON.parse(update);
    console.log("udpateObj:",updateObj);
    let whereObj = JSON.parse(where);
    let tokenResult = validateToken(token);
    if(tokenResult==undefined){
      //graphql使用抛出异常的方式将错误返给接口调用方
      throw new Error("invalid token");
    }
    let userId = tokenResult.userId;

    let privs = await getUserPrivs(userId);
    let privResult = checkPrivs(privs,"skus","update");
    console.log("updateSku attributes:",privResult);
    if(privResult.permit=="none"){
      throw new Error("没有权限");
    }
    let options={};

    if(privResult.permit=="part"){
      let attributesMap = privResult.attributesMap;
      for(let filed in updateObj){
        if(attributesMap[filed]==undefined){
          throw new Error("没有权限,filed:"+filed);
        }
      }
    }
    await Skus.update(updateObj,{where:whereObj});
    let sku = await getSkuById({token:token,id:whereObj.id});
    return sku;
}

async function getObjects({token ,tableName , where, currentPage, pageSize}){
  let Objects = SequelizeObjects[tableName];
  if(Objects==undefined) 
    throw new Error("no relate sequelize Object");

  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;

  let privs = await getUserPrivs(userId);
  let privResult = checkPrivs(privs,tableName,"select");
  console.log(`getObjects ${tableName} attributes:`,privResult);
  if(privResult.permit=="none"){
    throw new Error("没有权限");
  }
  let options={};

  if(privResult.permit=="part"){
    options["attributes"] = privResult.attributes;
  }

  console.log("getObjects:",token,where);
  if(where!=undefined && where!=""){
    let whereObj = JSON.parse(where);
    console.log(whereObj);
    options["where"]=whereObj;
  }
  if(currentPage==undefined || currentPage<=0){
    currentPage=1;
  }
  if(pageSize==undefined || pageSize<=0 || pageSize>100){
    pageSize=5; 
  }

  options["limit"]=pageSize;
  options["offset"]=pageSize*(currentPage-1);

  //let users = await Users.findAll(options);
  let result = await Objects.findAndCountAll(options);
  
  let frontObjects=[];
  for(let i in result.rows){
    let object = result.rows[i].toJSON();
    frontObjects.push(JSON.stringify(object));
  }
  return {objects:frontObjects,count:result.count};
}

async function getObjectById({token, tableName, id}){
  let Objects = SequelizeObjects[tableName];
  if(Objects==undefined) 
    throw new Error("no relate sequelize Object");

  let tokenResult = validateToken(token);
  if(tokenResult==undefined){
    //graphql使用抛出异常的方式将错误返给接口调用方
    throw new Error("invalid token");
  }
  let userId = tokenResult.userId;
  console.log("getObjectById:",userId);

  let privs = await getUserPrivs(userId);
  let privResult = checkPrivs(privs,tableName,"insert");
  console.log(`getObject ${tableName} attributes:`,privResult);
  if(privResult.permit=="none"){
    throw new Error("没有权限");
  }
  let options={};

  if(privResult.permit=="part"){
    options["attributes"] = privResult.attributes;
  }

  options["where"] = {
    id:id
  };

  let object = await Objects.findOne(options);
  if(object!=undefined){
    object=object.toJSON();
  }
  return JSON.stringify(object);
}

async function insertObject({token, tableName, item}) {
    let Objects = SequelizeObjects[tableName];
    if(Objects==undefined) 
      throw new Error(`no relate sequelize Object,tableName:${tableName}`);

    let obj = JSON.parse(item);

    let tokenResult = validateToken(token);
    if(tokenResult==undefined){
      //graphql使用抛出异常的方式将错误返给接口调用方
      throw new Error("invalid token");
    }
    let userId = tokenResult.userId;

    let privs = await getUserPrivs(userId);
    let privResult = checkPrivs(privs,tableName,"insert");
    console.log(`insertObject ${tableName} attributes:`,privResult);
    if(privResult.permit=="none"){
      throw new Error("没有权限");
    }
    let options={};

    if(privResult.permit=="part"){
      let attributesMap = privResult.attributesMap;
      for(let filed in obj){
        if(attributesMap[filed]==undefined){
          throw new Error("没有权限,filed:"+filed);
        }
      }
    }
    let result = await Objects.create(obj);
    let newOne = result.toJSON();
    return newOne.id;
}
async function deleteObject({token, tableName, where}) {
    let Objects = SequelizeObjects[tableName];
    if(Objects==undefined) 
      throw new Error(`no relate sequelize Object,tableName:${tableName}`);

    let whereObj = JSON.parse(where);

    let tokenResult = validateToken(token);
    if(tokenResult==undefined){
      //graphql使用抛出异常的方式将错误返给接口调用方
      throw new Error("invalid token");
    }
    let userId = tokenResult.userId;

    let privs = await getUserPrivs(userId);
    let privResult = checkPrivs(privs,tableName,"delete");
    console.log(`deleteObject ${tableName} attributes:`,privResult);
    if(privResult.permit!="all"){
      throw new Error("没有权限");
    }
    let result = await Objects.destroy({where:whereObj});
    return result;
}

async function updateObject({token, tableName, update ,where}) {
    let Objects = SequelizeObjects[tableName];
    if(Objects==undefined) 
      throw new Error("no relate sequelize Object,tableName:"+tableName);

    let updateObj = JSON.parse(update);
    console.log(`udpateObj ${tableName}:`,updateObj);
    let whereObj = JSON.parse(where);
    let tokenResult = validateToken(token);
    if(tokenResult==undefined){
      //graphql使用抛出异常的方式将错误返给接口调用方
      throw new Error("invalid token");
    }
    let userId = tokenResult.userId;

    let privs = await getUserPrivs(userId);
    let privResult = checkPrivs(privs,tableName,"update");
    console.log(`updateObject ${tableName} attributes:`,privResult);
    if(privResult.permit=="none"){
      throw new Error("没有权限");
    }
    let options={};

    if(privResult.permit=="part"){
      let attributesMap = privResult.attributesMap;
      for(let filed in updateObj){
        if(attributesMap[filed]==undefined){
          throw new Error("没有权限,filed:"+filed);
        }
      }
    }
    await Objects.update(updateObj,{where:whereObj});
    let object = await getObjectById({token:token,tableName:tableName,id:whereObj.id});
    return JSON.stringify(object);
}

var root= {
  //查列表
  articles:getArticles,
  //查详情
  article:getArticleById,

  //增删改
  insertArticle: insertArticle,
  deleteArticle: deleteArticle,
  updateArticle: updateArticle,

  //查列表
  users:getUsers,
  //查详情
  user:getUserById,

  //增删改
  insertUser: insertUser,
  deleteUser: deleteUser,
  updateUser: updateUser,

  //查列表
  sysUsers:getSysUsers,
  sysUser:getSysUserById,
  insertSysUser: insertSysUser,
  deleteSysUser: deleteSysUser,
  updateSysUser: updateSysUser,

  sysRoles:getSysRoles,
  sysRole:getSysRoleById,
  insertSysRole: insertSysRole,
  deleteSysRole: deleteSysRole,
  updateSysRole: updateSysRole,

  sysUserRoles:getSysUserRoles,
  sysUserRole:getSysUserRoleById,
  insertSysUserRole: insertSysUserRole,
  deleteSysUserRole: deleteSysUserRole,
  updateSysUserRole: updateSysUserRole,

  sysPrivsColumns:getSysPrivsColumns,
  sysPrivsColumn:getSysPrivsColumnById,
  insertSysPrivsColumn: insertSysPrivsColumn,
  deleteSysPrivsColumn: deleteSysPrivsColumn,
  updateSysPrivsColumn: updateSysPrivsColumn,

  sysPrivsTables:getSysPrivsTables,
  sysPrivsTable:getSysPrivsTableById,
  insertSysPrivsTable: insertSysPrivsTable,
  deleteSysPrivsTable: deleteSysPrivsTable,
  updateSysPrivsTable: updateSysPrivsTable,

  //菜单
  menus:getMenus,
  menu:getMenuById,
  insertMenu: insertMenu,
  deleteMenu: deleteMenu,
  updateMenu: updateMenu,

  charges:getCharges,
  charge:getChargeById,
  insertCharge: insertCharge,
  deleteCharge: deleteCharge,
  updateCharge: updateCharge,

  //单品
  skus:getSkus,
  sku:getSkuById,
  insertSku: insertSku,
  deleteSku: deleteSku,
  updateSku: updateSku,

  //todo 分页查询 依赖Sequelizejs的分页机制

  //通用操作
  objects:getObjects,
  object:getObjectById,
  insertObject: insertObject,
  deleteObject: deleteObject,
  updateObject: updateObject,

};


var myschema = buildSchema(`
  type User{
    id: Int,
    nickname: String,
    introduce: String,
    birthday: String,
    createdAt: String,
  },
  type UsersAndCount{
    count: Int,
    users: [User],
  },
  type SysUser{
    id: Int,
    name: String,
    createdAt: String,
    updatedAt: String,
  },
  type SysUsersAndCount{
    count: Int,
    sysUsers: [SysUser],
  },
  type SysRole{
    id: Int,
    name: String,
    createdAt: String,
    updatedAt: String,
  },
  type SysRolesAndCount{
    count: Int,
    sysRoles: [SysRole],
  },

  type SysUserRole{
    id: Int,
    userid: Int,
    userName: String,
    roleid: Int,
    roleName: String,
    createdAt: String,
    updatedAt: String,
  },
  type SysUserRolesAndCount{
    count: Int,
    sysUserRoles: [SysUserRole],
  },

  type SysPrivsColumn{
    id: Int,
    roleid: Int,
    tableName: String,
    columnName: String,
    columnPriv: String,
    createdAt: String,
    updatedAt: String,
  },
  type SysPrivsColumnsAndCount{
    count: Int,
    sysPrivsColumns: [SysPrivsColumn],
  },

  type SysPrivsTable{
    id: Int,
    roleid: Int,
    tableName: String,
    tablePriv: String,
    createdAt: String,
    updatedAt: String,
  },

  type SysPrivsTablesAndCount{
    count: Int,
    sysPrivsTables: [SysPrivsTable],
  },

  type Menu{
    id: Int,
    name: String
    skus:[Sku]
    ordernum: Int
  },
  type MenusAndCount{
    count: Int,
    menus: [Menu],
  },

  type Charge{
    id: Int,
    name: String,
    price: Float,
  },
  type ChargesAndCount{
    count: Int,
    charges: [Charge],
  },

  type Sku{
    id: Int
    menu: Int
    name: String
    image: String
    monthSale: Int
    smallCupPrice: Float
    midleCupPrice: Float
    bigCupPrice: Float
    charge: String
    taste: String
    temp: String
    createdAt: String
    updatedAt: String
  },
  type SkusAndCount{
    count: Int,
    skus: [Sku]
  },
  type ObjectsAndCount{
    count: Int,
    objects: [String]
  }
  type Comment{
    content: String
    createdAt: String
  },
  "文章"
  type Article{
    "文章id"
    id:Int
    "文章标题"
    title: String
    "文章列表缩略图"
    listImg: String
    "文章摘要"
    summary: String
    "文章详情"
    content: String
    "文章发布时间"
    createdAt: String
    "文章作者"
    author: User
    "文章标签"
    tags:String
    "文章评论"
    comments:[Comment]
  },
  type Query {
    sysUsers(token:String!,where:String,currentPage:Int,pageSize:Int):SysUsersAndCount,
    sysUser(token:String!,id:Int!):SysUser,

    sysRoles(token:String!,where:String,currentPage:Int,pageSize:Int):SysRolesAndCount,
    sysRole(token:String!,id:Int!):SysRole,

    sysUserRoles(token:String!,where:String,currentPage:Int,pageSize:Int):SysUserRolesAndCount,
    sysUserRole(token:String!,id:Int!):SysUserRole,

    sysPrivsColumns(token:String!,where:String,currentPage:Int,pageSize:Int):SysPrivsColumnsAndCount,
    sysPrivsColumn(token:String!,id:Int!):SysPrivsColumn,

    sysPrivsTables(token:String!,where:String,currentPage:Int,pageSize:Int):SysPrivsTablesAndCount,
    sysPrivsTable(token:String!,id:Int!):SysPrivsTable,

    articles(token:String!,where:String,currentPage:Int,pageSize:Int):[Article],
    article(token:String!,id:Int!):Article,

    users(token:String!,where:String,currentPage:Int,pageSize:Int):UsersAndCount,
    user(token:String!,id:Int!):User,

    menus(token:String!,where:String,currentPage:Int,pageSize:Int):MenusAndCount,
    menu(token:String!,id:Int!):Menu,

    charges(token:String!,where:String,currentPage:Int,pageSize:Int):ChargesAndCount,
    charge(token:String!,id:Int!):Charge,

    skus(token:String!,where:String,currentPage:Int,pageSize:Int):SkusAndCount,
    sku(token:String!,id:Int!):Sku,

    objects(token:String!,tableName:String!,where:String,currentPage:Int,pageSize:Int):ObjectsAndCount,
    object(token:String!,tableName:String!,id:Int!):String,
  },
  type Mutation {
    insertSysUser(token:String!,item: String!): Int,
    deleteSysUser(token:String!,where: String!): Int,
    updateSysUser(token:String!,update: String!, where: String!): SysUser,

    insertSysRole(token:String!,item: String!): Int,
    deleteSysRole(token:String!,where: String!): Int,
    updateSysRole(token:String!,update: String!, where: String!): SysRole,

    insertSysUserRole(token:String!,item: String!): Int,
    deleteSysUserRole(token:String!,where: String!): Int,
    updateSysUserRole(token:String!,update: String!, where: String!): SysUserRole,

    insertSysPrivsColumn(token:String!,item: String!): Int,
    deleteSysPrivsColumn(token:String!,where: String!): Int,
    updateSysPrivsColumn(token:String!,update: String!, where: String!): SysPrivsColumn,

    insertSysPrivsTable(token:String!,item: String!): Int,
    deleteSysPrivsTable(token:String!,where: String!): Int,
    updateSysPrivsTable(token:String!,update: String!, where: String!): SysPrivsTable,

    insertArticle(token:String!,item: String!): String,
    deleteArticle(token:String!,where: String!): Int,
    updateArticle(token:String!,update: String!, where: String!): Article,

    insertUser(token:String!,item: String!): String,
    deleteUser(token:String!,where: String!): Int,
    updateUser(token:String!,update: String!, where: String!): User,

    insertMenu(token:String!,item: String!): String,
    deleteMenu(token:String!,where: String!): Int,
    updateMenu(token:String!,update: String!, where: String!): Menu,

    insertCharge(token:String!,item: String!): String,
    deleteCharge(token:String!,where: String!): Int,
    updateCharge(token:String!,update: String!, where: String!): Charge,

    insertSku(token:String!,item: String!): String,
    deleteSku(token:String!,where: String!): Int,
    updateSku(token:String!,update: String!, where: String!): Sku,

    insertObject(token:String!,tableName:String!,item: String!): String,
    deleteObject(token:String!,tableName:String!,where: String!): Int,
    updateObject(token:String!,tableName:String!,update: String!, where: String!): String,
  }
`);


//*
app.use('/msServer/graphql', graphqlHTTP({
    schema: myschema,
    rootValue: root,
    graphiql: true, //启用GraphiQL,前端可以展示对应的文档
}));
app.get('/ip', function (req, res) {
  console.log(req.headers);
  res.send("ip:"+req.headers["x-real-ip"]);
});
app.post('/ip2', function (req, res) {
  console.log(req.headers);
  res.send("ip2:"+req.headers["x-real-ip"]);
});
//*/



app.get('/msServer/showTables', function (req, res) {
  console.log("showTables");
  sequelize.query("show tables",{ type: sequelize.QueryTypes.SHOWTABLES}).then((tableNames) => {
    let filtTableNames = [];
    for(let i in tableNames){
      tableName=tableNames[i]; 
      //if(tableName.substring(0,3)=="sys")
      //  continue;
      filtTableNames.push(tableName);
    }
    console.log(filtTableNames);
    res.send(JSON.stringify(filtTableNames));
  }).catch((e)=>{
    res.send(JSON.stringify({error:e.message}));
  });
});

app.get('/msServer/descTable', function (req, res) {
  let tableName = req.query.table;
  if(tableName==undefined || tableName==""){
    res.send(JSON.stringify({error:"参数错误,table不能为空"}));
    return;
  }

  sequelize.query(`desc ${tableName}`,{ type: sequelize.QueryTypes.DESCRIBE}).then((tableDesc) => {
    columnNames=[];
    for(let columnName in tableDesc)
      columnNames.push(columnName);
    res.send(JSON.stringify(columnNames));
  }).catch((e)=>{
    res.send(JSON.stringify({error:e.message}));
  });
});

app.post('/msServer/upload/image/', async function (req, res) {
  var form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.uploadDir = config.imageUploadDir;
  form.maxFileSize  = config.imageUploadMaxSize;
  let tmpFiles = {};
  form.parse(req, function(err, fields, files) {
    if(err){
      console.log("form parse error,",err.message);
      res.writeHead(200, {'content-type': 'application/json'});
      res.write(JSON.stringify({error:err.message}));
      res.end();
    }else{
      console.log("fields:",fields);
      for(let key in files){
        let fileObj = files[key];
        let type = fileObj.type;
        if(type.match("^image/")){
          let name = fileObj.name;
          let size = fileObj.size;
          let path = fileObj.path;
          let tmpName = path.replace(config.imageUploadDir,"");
          tmpFiles[key]=tmpName;
        }
      }
      res.writeHead(200, {'content-type': 'application/json'});
      res.write(JSON.stringify(tmpFiles));
      res.end();
    }
  });
});

var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("应用实例，访问地址为 http://%s:%s", host, port)
})
