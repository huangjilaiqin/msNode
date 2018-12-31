//schema.js
let graphql = require('graphql');


let count = 0;

let students = {
    "1": {
        "id": "1",
        "name": "Dan"
    },
    "2": {
        "id": "2",
        "name": "Marie"
    },
    "3": {
        "id": "3",
        "name": "Jessie"
    }
};

let Student =new graphql.GraphQLObjectType({
  name: "student",
  description: "student",
  fields: {
    id: {
      type: graphql.GraphQLInt,
      description: "student id"
    },
    name: {
      type: graphql.GraphQLString,
      description: "student name"
    },
  }
});


let schema = new graphql.GraphQLSchema({
  query: new graphql.GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      count: {
        type: graphql.GraphQLInt,
        description: "访问次数",
        resolve: function() {
          return count++;
        }
      },
      student: {
        type: Student,
        args: {
            id: {
                type: graphql.GraphQLInt
            }
        },
        resolve: function(_, args){
          return students[args.id];
        }
      },
      students:{
        type: new graphql.GraphQLList(Student),
         args: {
            id: {
                type: graphql.GraphQLInt
            }
        },
        resolve: function(_,args){
          return students;
        }
      }
    }
  })
});



//exports.schema=schema;
exports.default = schema;