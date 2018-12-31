//express_demo.js 文件
var express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
var formidable = require('formidable');
var graphql = require('graphql');
//var schema = require('./schema');
var app = express();
var router = express.Router();
//app.use('F:\\msNode\\static', express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.text({ type: 'application/graphql' }));
//var netutil = require("./netutil.js");

const config = require("./config.json");

router.use(function(req, res, next) {
    // 打印
    console.log('before call api');
    next(); // 在这里会将request交给下一个中间件，如果这个中间件后面没有其他中间件，请求会交给匹配的路由作处理
});

let bears={
  1:{
    name:"熊大",
    desc:"我是熊大",
  },
  2:{
    name:"熊二",
    desc:"熊大是我哥",
  },
  3:{
    name:"光头强",
    desc:"我是假熊,熊大、熊二最笨",
  }
};

let maxBearId=4;

router.get('/', function(req, res, next) {
  console.log("call api ing");
  res.json({ message: 'hooray! welcome to our api!' });   
  next();
});

router.route('/bears')
  .get(function(req, res, next) {
    res.json(bears);
    next();
  })
  .post((req, res, next)=>{
    console.log(req.body);
    let name=req.body.name;
    let desc=req.body.desc;
    if(name!=undefined && desc!=undefined){
      bears[maxBearId]={
        name,
        desc
      };
      maxBearId++;
      res.json({result:0,msg:"添加数据成功"});
    }else{
      res.json({result:-1,msg:"arguments error"});
    }
    next();
  });


router.route('/bears/:bear_id')
  // 根据id获取指定的bear (GET 请求 http://localhost:8080/api/bears/:bear_id)
  .get(function(req, res, next) {
    let bear_id=req.params.bear_id;
    let bear=bears[bear_id];
    if(bear!=undefined)
      res.json(bear);
    else
      res.json({result:"-1",msg:"not found"});
    next();
  })
  .put((req, res, next)=>{
    let bear_id=req.params.bear_id;
    let bear=bears[bear_id];
    if(bear!=undefined){
      console.log(req.params);
      console.log(req.body);
      if(req.body.name==undefined || req.body.desc==undefined){
        res.json({result:-1,msg:"arguments error"});
      }else{
        bear.name=req.body.name;
        bear.desc=req.body.desc;
        bears[bear_id]=bear;
        res.json({result:0,msg:"更新成功"});
      }
    }else{
      res.json({result:-1,msg:"id not exist"});
    }
    next();
  })
  .delete((req,res,next)=>{
    let bear_id=req.params.bear_id;
    let bear=bears[bear_id];
    if(bear!=undefined){
      delete bears[bear_id];
      console.log(bears);
      res.json({result:0,msg:"删除成功"});
    }else{
      res.json({result:-1,msg:"id not exist"});
    }
    next();
  })
/*
router.get('/bears', function(req, res, next) {
  console.log("call api ing");
  res.json({ message: 'hooray! welcome to our api!' });   
  next();
});
*/



router.use(function(req, res, next) {
    // 打印
    console.log('after call api');
    next(); // 在这里会将request交给下一个中间件，如果这个中间件后面没有其他中间件，请求会交给匹配的路由作处理
});

app.use('/api', router);

app.get('/', function (req, res) {
  res.send('Hello World');
})
/*
app.get('/ip', function (req, res) {
  res.send(req.headers["x-real-ip"]);
})

app.get('/node/getMiniSkey/', async function (req, res) {
  let appid = "wx52c4085276d695a0";
  let secret = "c2b1374a993357689bf3668ef42abddd";
  let code = req.query.code;
  let apiUrl = "https://api.weixin.qq.com/sns/jscode2session?appid="+appid+"&secret="+secret+"&js_code="+code+"&grant_type=authorization_code";

  //let r=await netutil.get({url:apiUrl});

  console.log(r.body.toString());
  res.send({"url":apiUrl});

})

app.get('/node/testpost/', async function (req, res) {
  console.log(req); 
})
app.post('/node/testpost/', async function (req, res) {
  console.log("post:",req.body); 
  
  var body = "";
  req.on('data', function (chunk) {
    body += chunk;  //一定要使用+=，如果body=chunk，因为请求favicon.ico，body会等于{}
    console.log("chunk:",chunk);
  });
  req.on('end', function () {
    console.log(req.headers);
    console.log(body);
     //body = querystring.parse(body); 
  });
  
})


app.get('/node/testmysql/', async function (req, res) {
  var mysql      = require('mysql');
  var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'root',
    password : '123456',
    database : 'minisurvey'
  });
 
  connection.connect();
 
  connection.query('SELECT * from t_channel_info', function (error, results, fields) {
    if (error) throw error;
    res.writeHead(200, {'content-type': 'application/json'});
    res.write(JSON.stringify(results));
    res.end();
  });
});

*/

/*
app.post('/graphql', (req, res) => {
  //GraphQL executor
  graphql(schema, req.body)
  .then((result) => {
    res.send(JSON.stringify(result, null, 2));
  })
});
*/

app.post('/upload/image/', async function (req, res) {
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
