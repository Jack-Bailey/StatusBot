# Status Discord Bot

A simple yet easily configurable and effective discord.js bot that can be used to keep track of the status of many applications using slash commands.

#### **`.env`**

```
TOKEN=DISCORD-TOKEN
```

## Installation

```
npm install
```

## Setup

### Config

Fill in all the empty strings in **`config.json`** with your own information.
adminRoles is an array of strings of admin roles (that can perform set/reset)

### Command Initialisation

```
node registerCommands.js
```

## Running

```
node index.js
```

## Limitations

There is a slight chance the data.json will be corrupted if two people use get/set at the same time but this is very unlikely - could be solved with a data-lock.json file but this is not (yet) implemented.
