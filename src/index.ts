import { Hono } from 'hono'
import signup from './auth/signup'
import { connectDB } from '../helper/dbConnect'
import login from './auth/login'
import googleAuth from './auth/googleAuth'
import test from './test/test'
import forgotPassword from './auth/forgot-password'
import profile from './profile/profile'
const app = new Hono()

connectDB()
app.route('/',signup)
app.route('/',login)
app.route('/',googleAuth)
app.route('/',test)
app.route('/',forgotPassword)
app.route('/',profile)
app.get('/', (c) => {
 
  return c.text('Hello Hono!')
})

export default app
