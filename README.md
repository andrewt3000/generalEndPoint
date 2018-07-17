# General Framework seed project
This is a seed project for the General Framework(GF), which is designed to  quickly create crud screens and reducing boilerplate. GF allows you to craft simple data aware react components that require no server side programming.  General Framework is a collection of open source libraries outlined below.  

### Server Side
[JQL](https://github.com/andrewt3000/jql#jql) Json Query language. Converts json to sql.   
[General Endpoint](https://github.com/andrewt3000/generalEndPoint#general-endpoint-seed-project) (GE) data driven http api  

### Client Side
[General Store](https://github.com/andrewt3000/generalStore) (GS) - mobx store integrated with GE  
[General Components](https://github.com/andrewt3000/generalComponents#general-components) - data aware react components integrated with GS and GE.

# General Endpoint
This seed project is a reference implementation of the General EndPoint. General Endpoint is an api that accepts and returns json objects that implement sql crud commands with no programming. It uses a variation of Rest conventions. Internally GE uses a jql, which turns json into sql statements.  

General Endpoint is designed for typical uses cases, not all queries. Create custom endpoints for more complicated database operations.  

This seed project is dependent on: node, express, auth0, and Sql Server database (and it's driver). However the conventions of General Endpoint and JQL are independent.

### Database Naming conventions
General endpoint is depenent on 3 database normalization conventions:  
1. All tables must have an ID field that is primary key and autoincrements.  
2. FKs follow naming convention {tableName}ID.  
3. FK lookup tables have a "name" field for display.  
Tip: Use a computed column for names that are composites.   


### General EndPoint Http Conventions
GE http conventions are similar, but different from rest conventions.

| HTTP | Url | Description | Returns
| --- | --- | --- | --- |
GET | /api/general/{tableName}/ | Get all records | Object[]
GET | /api/general/{tableName}/{ID} | Get record by ID | Object
POST | /api/general/{tableName} | Query records. See [JQL](https://github.com/andrewt3000/jql/blob/master/README.md#jql-1)  for body specifications | Object[]
POST | /api/general/count/{tableName} | Pulls count for table. Accepts body with jql where clause | number
PUT | /api/general/{tableName} | Insert or update a record. Post body is object to insert or update. does upsert based on whether ID field is present in object. <br><br>Arrays attached to object will be added as child tables using the object property as the tableName and using foreign key naming convention to set parent ID. deletedChildren is an object property that will delete from child tables using first object attribute as table name and property of the table name is an array of ids to be deleted. This creates stipulation that tables can't have fields named deletedChildren or the name of child tables. |
DELETE | /api/general/{tableName}/{ID} | Delete a record |

### Security
In GE all authenticated users are trusted with access to select, insert, update, and delete functionality for all tables. Role based security is currently not implemented. GE is useful for prototyping and for apps where all users are highly trusted, for instance an app for a small company or an admin app for a small saas product. 

It's important to not have security credentials such as usernames and passwords in the database. Otherwise authenticated users could compromise security. They could, for instance, get a list of all usernames and update other user's passwords. You can use another database or use a 3rd party authentication service. This seed project uses [auth0](https://auth0.com/). 

JQL validates the table and column names against a schema. It also parameterizes it's inputs against sql injection. 


### Logging
General EndPoint also has a logging mechanism that requires this table be added named HistoryLog.  
(TODO: make optional)  

CREATE TABLE dbo.HistoryLog (  
&nbsp;	ID int NOT NULL IDENTITY(1,1),  
&nbsp;	tableName varchar(100) NULL,  
&nbsp;	tableKey int NULL,  
&nbsp;	userName varchar(100) NULL,  
&nbsp;	eventDate datetime NULL,  
&nbsp;	description varchar(255) NULL,  
&nbsp;	[before] text(16) NULL,  
&nbsp;	[after] text(16) NULL,  
&nbsp;	diff text(16) NULL  
);  
  
ALTER TABLE dbo.HistoryLog ADD CONSTRAINT PK_HistoryLog PRIMARY KEY (ID);  

## To run

The config for auth0 is in /server/index.js  
The database config is in server/db/index.js  

From /server directory.  
npm install  

### npm run dev  
Starts the app for development on port 3001  

### npm start 
Starts the production version of the app  

### npm test
Tests jql

