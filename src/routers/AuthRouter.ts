import Router from '@/core/Router'
import AuthController from '@/controllers/AuthController'
import { createTokenMiddleware, isLoginMiddleware, loginAccountMiddleware, registerAccountMiddleware } from '@/middlewares/auth'

class AuthRouter extends Router {
  public routes (): void {
    this.router.post('/register', registerAccountMiddleware, AuthController.register)
    this.router.post('/login', loginAccountMiddleware, AuthController.login)
    this.router.post('/token', createTokenMiddleware, AuthController.createToken)
    this.router.get('/user', isLoginMiddleware, AuthController.getUser)
  }
}

export default AuthRouter
