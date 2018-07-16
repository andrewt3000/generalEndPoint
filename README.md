# General EndPoint seed project
This is a General Endpoint (GE) seed project. This seed project is dependent on: express, auth0, and Sql Server database. However the concept and conventions of General Endpoint and JQL could be decoupled from these dependencies.

### Server Side
[JQL](https://github.com/andrewt3000/jql#jql) Json Query language. Converts json to sql.   
[General Endpoint](https://github.com/andrewt3000/generalEndPoint#general-endpoint-seed-project) (GE) data driven node api  

### Client Side
[General Store](https://github.com/andrewt3000/generalStore) (GS) - mobx store integrated with GE  
[General Components](https://github.com/andrewt3000/generalComponents#general-components) - data aware react/antd components integrated with GS and GE.


# General Endpoint
General Endpoint is a frameworks for quickly creating crud screens and reducing boilerplate.
General Endpoint is designed for typical uses cases, not all queries. Create custom endpoints for more complicated database operations.  
It is only for quick prototyping or for production use in an environment where authenticated users are highly trusted. (See [Security](https://github.com/andrewt3000/generalEndPoint#security))
General Endpoint is an api that accepts and returns json objects that implement sql crud commands with no programming. It uses a variation of Rest conventions. Internally GE uses a jql, code that turns json into sql statements.      

### Naming conventions
General endpoint relies on 3 normalization conventions:  
1. All tables must have an ID field that is primary key and autoincrements.  
2. FKs follow naming convention {tableName}ID.  
3. FK lookup tables have a "name" field for display. Use a computed column for names that are composites.   


### General EndPoint
GE HTTP conventions (similar to rest)

| HTTP | Url | Description | Returns
| --- | --- | --- | --- |
GET | /api/general/{tableName}/ | Get all records | Object[]
GET | /api/general/{tableName}/{ID} | Get record by ID | Object
POST | /api/general/{tableName} | Query records. See [JQL](https://github.com/andrewt3000/jql/blob/master/README.md#jql-1)  for body specifications | Object[]
POST | /api/general/count/{tableName} | Pulls count for table. Accepts body with jql where clause | number
PUT | /api/general/{tableName} | Insert or update a record. Post body is object to insert or update. does upsert based on whether ID field is present in object. <br><br>Arrays attached to object will be added as child tables using the object property as the tableName and using foreign key naming convention to set parent ID. deletedChildren is an object property that will delete from child tables using first object attribute as table name and property of the table name is an array of ids to be deleted. This creates stipulation that tables can't have fields named deletedChildren or the name of child tables. |
DELETE | /api/general/{tableName}/{ID} | Delete a record |

## Security
GE is only for quick prototyping or for production use in an environment where all authenticated users are highly trusted. Example uses are an app for a small company or perhaps an admin app. All users have access to all select, insert, update, and delete functionality. A layer of security restricting access by role would make GE more useful.  

Even with a small number of trusted users, it's important to not have a usernames and passwords in the database and to use a 3rd party such as auth0. Otherwise authenticated users could get a list of all usernames and update other user's passwords even if they are hashed.

JQL is constructed to guard against sql injection attacks and it validates the table and column names against a schema.
It also parameterizes it's input parameters against sql injection. This prevents accesss to create, drop, and alter commands.

# To run

From /server directory.  
npm install  

The config for auth0 is in /server/index.js  
The database config is in server/db/index.js  

### Logging
General EndPoint also has an extensive logging mechanism that requires this table be added named HistoryLog. (TODO: make it configurable to cut it off.)  

CREATE TABLE dbo.HistoryLog (  
	ID int NOT NULL IDENTITY(1,1),  
	tableName varchar(100) NULL,  
	tableKey int NULL,  
	userName varchar(100) NULL,  
	eventDate datetime NULL,  
	description varchar(255) NULL,  
	[before] text(16) NULL,  
	[after] text(16) NULL,  
	diff text(16) NULL  
);  
  
ALTER TABLE dbo.HistoryLog ADD CONSTRAINT PK_HistoryLog PRIMARY KEY (ID);  

### npm run dev  
Starts the app for development on port 3001  

### npm start 
Starts the production version of the app  

### npm test
Tests jql

