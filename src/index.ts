import { Hono } from 'hono'
import signup from './auth/signup'
import { connectDB } from '../helper/dbConnect'
import login from './auth/login'
import googleAuth from './auth/googleAuth'
const app = new Hono()

connectDB()
app.route('/',signup)
app.route('/',login)
app.route('/',googleAuth)
app.get('/', (c) => {
 
  return c.text('Hello Hono!')
})

export default app
