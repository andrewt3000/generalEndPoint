const Auth0 = require("auth0")

class UserController {
  constructor() {
    this.auth0 = new Auth0.AuthenticationClient({
      domain: "mycompany.auth0.com",
      clientId: "clientSecret",
      clientSecret:
        "clientSecret"
    })
  }

  async getAuth0Token() {
    let token = ""
    try {
      token = await this.auth0.clientCredentialsGrant({
        audience: "https://mycompany.auth0.com/api/v2/",
        scope: "read:users read:user_idp_tokens read:users_app_metadata"
      })
    } catch (error) {
      console.log(error)
    }
    return token.access_token
  }

  async getUserInfo(userId) {
    const auth0Token = await this.getAuth0Token()
    const management = new Auth0.ManagementClient({
      token: auth0Token,
      domain: "pursell.auth0.com"
    })

    let profile = { name: "" }
    try {
      profile = await management.getUser({ id: userId })
    } catch (error) {
      console.log(error)
    }
    profile.name = profile.user_metadata.name
    return profile
  }

  async getProfile(req, res, next) {
    const profile = await this.getUserInfo(req.user.sub)
    return res.status(200).json(profile)
  }
}

module.exports = new UserController()
