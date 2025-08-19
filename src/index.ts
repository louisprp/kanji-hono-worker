import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { vValidator } from '@hono/valibot-validator'
import { object, string, pipe, custom } from 'valibot'

type Env = {
  Bindings: {
    AUTH_TOKEN: string;
  };
};

const app = new Hono<Env>();

const PayloadSchema = object({
  chars: pipe(
    string(),
    custom((value) => {
      const length = Array.from(value).length
      return length >= 1 && length <= 3
    }, 'chars must be between 1 and 3 characters long')
  )
})

app.post(
  '/',
  bearerAuth({
    verifyToken: (token, c) => token === c.env.AUTH_TOKEN,
  }),
  vValidator('json', PayloadSchema),
  (c) => {
    const { chars } = c.req.valid('json')
    return c.json({
      ok: true,
      chars,
      length: Array.from(chars).length,
    })
  }
)

export default app
