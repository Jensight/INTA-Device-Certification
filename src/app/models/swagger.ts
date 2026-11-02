import { SERVER } from './config';

export const swagger = {
  "swagger": "2.0",
  "info": {
    "description": "Exposed API of vAUTO Framework for integration with other Frameworks like Robot",
    "version": "1.0.0",
    "title": "vAUTO API",
    "termsOfService": "",
    "contact": {
      "email": "sathyamoorthy.p@infosys.com"
    },
    "license": {
      "name": "Infosys"
    }
  },
  "host": 'SERVER',
  "basePath": "/VAUTO",
  "schemes": [
    "http"
  ],
  "paths": {
    "/auth/login": {
      "put": {
        "tags": [
          "Login"
        ],
        "summary": "Login to application to get access token",
        "description": "",
        "operationId": "login",
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": "Pet object that needs to be added to the store",
            "required": true,
            "schema": {
              "$ref": "#/definitions/Auth"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Auth"
            }
          },
          "400": {
            "description": "Failed. Check Response body for more details"
          }
        },
        "security": []
      }
    },

    "/device/name/{device Name}": {
      "get": {
        "tags": [
          "Device"
        ],
        "summary": "Find a device using its Name",
        "description": "Mongodb Id is use to fetch the details of a device",
        "operationId": "device Name",
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "device Name",
            "in": "path",
            "description": "Name of the device that needs to be fetched",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Device"

            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },



    "/device/id/{device id}": {
      "get": {
        "tags": [
          "Device"
        ],
        "summary": "Find a device using its ID",
        "description": "Mongodb Id is use to fetch the details of a device",
        "operationId": "device id",
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "device id",
            "in": "path",
            "description": "Id of the device that needs to be fetched",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Device"
            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },

    "/device/reserve": {
      "post": {
        "tags": [
          "Device"
        ],
        "summary": "Reserving a device",
        "description": "",
        "operationId": "reservation Name",
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": "Pet object that needs to be added to the store",
            "required": true,
            "schema": {

              "$ref": "#/definitions/Reserve"

            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Reserve"

            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },

    "/device/block": {
      "post": {
        "tags": [
          "Device"
        ],
        "summary": "blocking a device",
        "description": "",
        "operationId": "reservation Name",
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": "Pet object that needs to be added to the store",
            "required": true,
            "schema": {

              "$ref": "#/definitions/Block"

            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Block"

            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },


    "/device/reserve/{id}": {
      "delete": {
        "tags": [
          "Device"
        ],
        "summary": "Using Mongodb id reserved device gets unlocked",
        "description": "",
        "operationId": "id",
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Id of the device that needs to be unlocked",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "success": {
                "type": "boolean"
              }

            }
          },
          "400": {
            "description": "Invalid Id"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },

    "/testbed/name/{testbed Name}": {
      "get": {
        "tags": [
          "Testbed"
        ],
        "summary": "Find a testbed using its Name",
        "description": "Mongodb Id is use to fetch the details of a testbed",
        "operationId": "testbed Name",
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "testbed Name",
            "in": "path",
            "description": "Name of the testbed that needs to be fetched",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Testbed"

            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },


    "/testbed/id/{testbed id}": {
      "get": {
        "tags": [
          "Testbed"
        ],
        "summary": "Find a testbed using its ID",
        "description": "Mongodb Id is use to fetch the details of a testbed",
        "operationId": "testbed id",
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "testbed id",
            "in": "path",
            "description": "Id of the testbed that needs to be fetched",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Testbed"
            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },


    "/testbed/reserve": {
      "post": {
        "tags": [
          "Testbed"
        ],
        "summary": "Reserving a testbed",
        "description": "",
        "operationId": "reservation Name",
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": "Pet object that needs to be added to the store",
            "required": true,
            "schema": {

              "$ref": "#/definitions/Reservetestbed"

            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/Reservetestbed"

            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },

    "/testbed/block": {
      "post": {
        "tags": [
          "Testbed"
        ],
        "summary": "blocking a testbed",
        "description": "",
        "operationId": "reservation Name",
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "description": "Pet object that needs to be added to the store",
            "required": true,
            "schema": {

              "$ref": "#/definitions/BlockTestbed"

            }
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "$ref": "#/definitions/BlockTestbed"

            }
          },
          "400": {
            "description": "Invalid status value"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },


    "/testbed/reserve/{id}": {
      "delete": {
        "tags": [
          "Testbed"
        ],
        "summary": "Using Mongodb id reserved testbed gets unlocked",
        "description": "",
        "operationId": "id",
        "produces": [
          "application/json"
        ],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "description": "Id of the testbed that needs to be unlocked",
            "required": true,
            "type": "string"
          }
        ],
        "responses": {
          "200": {
            "description": "successful operation",
            "schema": {
              "success": {
                "type": "boolean"
              }

            }
          },
          "400": {
            "description": "Invalid Id"
          }
        },
        "security": [
          {
            "JWT": []
          }
        ]
      }
    },


  },
  "securityDefinitions": {
    "JWT": {
      "description": "",
      "type": "apiKey",
      "name": "Authorization",
      "in": "header"
    }
  },
  "definitions": {
    "Auth": {
      "type": "object",
      "properties": {
        "username": {
          "type": "string"
        },
        "password": {
          "type": "string"
        },
        "domain": {
          "type": "string"
        }
      }
    },

    "Block": {
      "type": "object",
      "properties": {
        "reservationName": {
          "type": "string"
        },
        "allowedUsers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "deviceName": {
          "type": "string"
        },

      }
    },



    "BlockTestbed": {
      "type": "object",
      "properties": {
        "reservationName": {
          "type": "string"
        },
        "allowedUsers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "testbedName": {
          "type": "string"
        },

      }
    },
    "Testbed": {
      "type": "object",
      "properties": {
        "_id": {
          "type": "string"
        },
        "deviceName": {
          "type": "string"
        },
        "vendor": {
          "type": "string"
        },
        "model": {
          "type": "string"
        },
        "profileName": {
          "type": "string"
        },
        "profileId": {
          "type": "string"
        },
        "available": {
          "type": "boolean"
        },
        "reservedBy": {
          "type": "string"
        },
        "reservedTill": {
          "type": "string"
        },
        "reservedAt": {
          "type": "string"
        },
        "reservedFor": {
          "type": "string"
        },
        "driver": {
          "type": "string"
        },
        "createdAt": {
          "type": "string"
        },
        "updatedAt": {
          "type": "string"
        },
        "availableAt": {
          "type": "string"
        },
        "reservationType": {
          "type": "string"
        },
        "session": {
          "type": "string"
        },
        "reservedAPI": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
      }
    },
    "Reserve": {
      "type": "object",
      "properties": {
        "reservationName": {
          "type": "string"
        },
        "allowedUsers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "reserveType": {
          "type": "string"
        },
        "reserveAt": {
          "type": "string"
        },
        "releaseAt": {
          "type": "string"
        },
        "deviceName": {
          "type": "string"
        },

      }
    },

    "Reservetestbed": {
      "type": "object",
      "properties": {
        "reservationName": {
          "type": "string"
        },
        "allowedUsers": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "reserveType": {
          "type": "string"
        },
        "reserveAt": {
          "type": "string"
        },
        "releaseAt": {
          "type": "string"
        },
        "testbedName": {
          "type": "string"
        },

      }
    },

    "Device": {
      "type": "object",
      "properties": {

        "_id": {
          "type": "string"
        },
        "deviceName": {
          "type": "string"
        },
        "vendor": {
          "type": "string"
        },
        "model": {
          "type": "string"
        },
        "profileName": {
          "type": "string"
        },
        "profileId": {
          "type": "string"
        },
        "available": {
          "type": "boolean"
        },
        "reservedBy": {
          "type": "string"
        },
        "reservedTill": {
          "type": "string"
        },
        "reservedAt": {
          "type": "string"
        },
        "reservedFor": {
          "type": "string"
        },
        "driver": {
          "type": "string"
        },
        "createdAt": {
          "type": "string"
        },
        "updatedAt": {
          "type": "string"
        },
        "availableAt": {
          "type": "string"
        },
        "reservationType": {
          "type": "string"
        },
        "session": {
          "type": "string"
        },
        "reservedAPI": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }


      }
    }
  },
  "externalDocs": {
    "description": "Find out more about Swagger",
    "url": "http://swagger.io"
  }
}

swagger.host = SERVER.slice(7, -1);
