import Config from '@/config'
import ORDER_STATUS from '@/constants/ORDER_STATUS'
import Service from '@/core/Service'
import { type IResponseWithParams, type IResponse } from '@/interfaces/IResponse'
import { type Order } from '@prisma/client'

class OrderService extends Service {
  public async orderBook (): Promise<IResponse> {
    try {
      const [books, users] = await Promise.all([
        this.prisma.book.findMany({
          where: {
            id: this.body.bookId
          }
        }),
        this.prisma.user.findMany({
          where: {
            id: this.locals.decoded.code
          }
        })
      ])

      if (books.length > 0) {
        if (users?.length > 0 && books[0].price <= users[0].point) {
          try {
            await Promise.all([
              this.prisma.order.create({
                data: {
                  status: ORDER_STATUS.PENDING,
                  userId: this.locals.decoded.code,
                  bookId: this.body.bookId
                }
              }),
              this.prisma.user.update({
                where: {
                  id: this.locals.decoded.code
                },
                data: {
                  point: users[0].point - books[0].price
                }
              })
            ])

            return {
              statusCode: 200,
              message: `${books[0].title} book is ordered`
            }
          } catch (err) {
            const { message } = err as Error
            return {
              statusCode: 500,
              errors: [message]
            }
          }
        } else {
          return {
            statusCode: 400,
            message: 'your point is not sufficient'
          }
        }
      } else {
        return {
          statusCode: 400,
          errors: ['Book is not found']
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

  public async cancelOrder (): Promise<IResponse> {
    try {
      const [order, user] = await Promise.all([
        this.prisma.order.findUnique({
          where: {
            id: this.params.id
          },
          include: {
            book: true
          }
        }),
        this.prisma.user.findUnique({
          where: {
            id: this.locals.decoded.code
          }
        })
      ])

      if (order && user) {
        await Promise.all([
          this.prisma.order.update({
            where: {
              id: this.params.id
            },
            data: {
              status: ORDER_STATUS.CANCELED
            }
          }),
          this.prisma.user.update({
            where: {
              id: this.locals.decoded.code
            },
            data: {
              point: user.point + order.book.price
            }
          })
        ])

        return {
          statusCode: 200,
          message: 'Your order is cancelled successfully'
        }
      } else {
        return {
          statusCode: 400,
          message: 'Your order is not found'
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

  public async payBook (): Promise<IResponse> {
    try {
      const order = await this.prisma.order.findUnique({
        where: {
          id: this.params.id
        }
      })

      if (order) {
        await this.prisma.order.update({
          where: {
            id: this.params.id
          },
          data: {
            status: ORDER_STATUS.SUCCESS
          }
        })

        return {
          statusCode: 200,
          message: 'Payment successfully'
        }
      } else {
        return {
          statusCode: 400,
          message: 'Your order is not found'
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

  public async getOrders (): Promise<IResponseWithParams<Order[]>> {
    try {
      const orders = await this.prisma.order.findMany({
        where: {
          status: this.params.status,
          userId: this.locals.decoded.code
        },
        include: {
          book: {
            include: {
              bookTag: {
                include: {
                  tag: true
                }
              }
            }
          }
        }
      })

      return {
        statusCode: 200,
        data: orders.map(order => ({
          ...order,
          book: {
            ...order.book,
            image: `${Config.APP_URL}/static/${order.book.image}`
          }
        }))
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

export default OrderService
