import bcryptjs from 'bcryptjs'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import Service from '@/core/Service'
import { type IResponseWithParams, type IResponse } from '@/interfaces/IResponse'
import type IToken from '@/interfaces/IToken'
import { createJwtToken } from '@/helpers/token'
import Config from '@/config'
import { type User } from '@prisma/client'

class AuthService extends Service {
  public async register (): Promise<IResponse> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          email: this.body.email
        }
      })

      if (users.length === 0) {
        await this.prisma.user.create({
          data: {
            email: this.body.email as string,
            password: bcryptjs.hashSync(this.body.password as string, 8),
            point: 100
          }
        })

        return {
          statusCode: 201,
          message: 'Register successfully'
        }
      } else {
        return {
          statusCode: 400,
          message: 'Register failed',
          errors: ['user already exist']
        }
      }
    } catch (err) {
      const { message } = err as Error
      return {
        statusCode: 500,
        errors: [message]
      }
    }
  }

  public async login (): Promise<IResponseWithParams<IToken>> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          email: this.body.email as string
        }
      })

      if (users.length > 0 && bcryptjs.compareSync(this.body.password as string, users[0].password)) {
        const { accessToken, refreshToken } = createJwtToken<{ code: string }>({ code: users[0].id })

        return {
          statusCode: 200,
          data: {
            accessToken,
            refreshToken
          }
        }
      } else {
        return {
          statusCode: 400,
          errors: ['user does not exist']
        }
      }
    } catch (err) {
      const { message } = err as Error
      return {
        statusCode: 500,
        errors: [message]
      }
    }
  }

  public async createToken (): Promise<IResponseWithParams<IToken>> {
    const refreshToken = this.body.refreshToken as string

    try {
      const result: JwtPayload | string = jwt.verify(refreshToken, Config.REFRESH_TOKEN.KEY)

      if (typeof result === 'object') {
        const { accessToken, refreshToken: newRefreshToken } = createJwtToken<{ code: string }>({ code: result.code })
        return {
          statusCode: 200,
          data: {
            accessToken,
            refreshToken: newRefreshToken
          }
        }
      } else {
        return {
          statusCode: 400,
          errors: ['Failed to create token']
        }
      }
    } catch (err) {
      const { message } = err as Error

      return {
        statusCode: 500,
        errors: [message]
      }
    }
  }

  public async getUser (): Promise<IResponseWithParams<User>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: this.locals.decoded.code
        }
      })

      if (user) {
        return {
          statusCode: 200,
          data: user
        }
      }

      return {
        statusCode: 400,
        errors: ['user not found']
      }
    } catch (err) {
      const { message } = err as Error

      return {
        statusCode: 500,
        errors: [message]
      }
    }
  }
}

export default AuthService
