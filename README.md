
数据库
	在数据库执行这个文件内容  sql.txt


1. 安装模块
	npm install
2. 开发环境启动
	node main_graphql.js


graphql
	添加新的表
		1. 建立数据库表
		2. 使用sequelize声明表对应的实体,后面可以使用这个实体的findOne,destroy,update,create,findAndCountAll
				sequelize.define
				定义对应增删改查的函数
				填充root
				填充myschema 
		3. 在main_graphql.js 中的buildSchema定义表结构和声明对外的接口方法
		4. root 中实现buildSchema中声明的方法,使用2中的方法获取数据库中的数据


 
数据库迁移 
	mysqldump -h47.98.171.206 -umstemplate -pmstemplate_pass mstemplate >mstemplate.sql 
	mysql -umstemplate -pmstemplate_pass mstemplate < /Users/laiqin/Desktop/mstemplate.sql 
