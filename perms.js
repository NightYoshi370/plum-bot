const Permission = require("./classes/Permission.js")

class PermissionZero extends Permission {
  constructor(client) {
    super(client, 0, "Bot", "Bots are pieces of code that do stuff when triggered.")
  }
  
  validate(member) {
    return member.user.bot
  }
}

class PermissionOne extends Permission {
  constructor(client) {
    super(client, 1, "User", "Everyone is a user (except bots).")
  }
  
  validate(member) {
    if (member.user.bot) return false
    return true
  }
}

class PermissionTwo extends Permission {
  constructor(client) {
    super(client, 2, "Server moderator", "Server moderators are the owner's helpers in moderating the server.")
  }
  
  validate(member) {
    if (member.user.bot) return false
    let mRole = member.guild.config.data.mods;
    return member.roles.cache.has(mRole);
  }
}

class PermissionThree extends Permission {
  constructor(client) {
    super(client, 3, "Server admin", "Server admins are the owner's helpers in moderating and managing the server.")
  }
  
  validate(member) {
    if (member.user.bot) return false
    let mRole = member.guild.config.data.admins;
    return member.roles.cache.has(mRole);
  }
}

class PermissionFour extends Permission {
  constructor(client) {
    super(client, 4, "Server owner", "The server owner is the person who created the server, or inherited the privilege from them.")
  }
  
  validate(member) {
    if (member.user.bot) return false
    let mRole = member.guild.config.owners;
    return member.roles.cache.has(mRole) || member.guild.ownerID == member.user.id;
  }
}

class PermissionTen extends Permission {
  constructor(client) {
    super(client, 10, "Bot owner", "The bot owner, or Developer, is whoever made the bot.")
  }
  
  validate(member) {
    if (member.user.bot) return false
    return this.client.isOwner(member.user)
  }
}

module.exports = [ PermissionZero, PermissionOne, PermissionTwo, PermissionThree, PermissionFour, PermissionTen ]