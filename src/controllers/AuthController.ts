import response from '@/helpers/response'
import AuthService from '@/services/AuthService'
import { type Request, type Response } from 'express'

class AuthController {
  public static async register (req: Request, res: Response): Promise<void> {
    const authService = new AuthService(req)
    const result = await authService.register()
    response(res, result)
  }

  public static async login (req: Request, res: Response): Promise<void> {
    const authService = new AuthService(req)
    const result = await authService.login()
    response(res, result)
  }

  public static async createToken (req: Request, res: Response): Promise<void> {
    const authService = new AuthService(req)
    const result = await authService.createToken()
    response(res, result)
  }

  public static async getUser (req: Request, res: Response): Promise<void> {
    const authService = new AuthService(req)
    const result = await authService.getUser()
    response(res, result)
  }
}

export default AuthController
