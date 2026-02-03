/**
 * Authentication Helper Functions
 * Handles user registration, login, and session management with Appwrite
 * 
 * ⚠️  DEPRECATED - Using NextAuth with Prisma instead
 * 
 * This file is kept for reference only and is no longer used.
 * All authentication should use NextAuth v5 via @/lib/auth
 */

/* Deprecated Code - Using NextAuth instead

// import { createAdminClient, createSessionClient, ID } from './appwrite-server'
// import { createUser, getUserByEmail } from './appwrite-db'
import { cookies } from 'next/headers'

const SESSION_COOKIE = 'appwrite-session'

// ============================================
// REGISTRATION
// ============================================

export async function registerUser(data: {
  email: string
  password: string
  name: string
}) {
  try {
    // const { appwriteConfig } = await import('./appwrite.config')
    
    // Use REST API directly instead of SDK
    const userId = generateId()
    
    console.log('Creating user via REST API:', { userId, email: data.email })
    
    const response = await fetch(
      `${appwriteConfig.endpoint}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
          'X-Appwrite-Project': appwriteConfig.projectId,
        },
        body: JSON.stringify({
          userId: userId,
          email: data.email,
          password: data.password,
          name: data.name,
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      console.error('Appwrite API error:', error)
      throw new Error(error.message || 'Failed to create user')
    }

    const authUser = await response.json()
    console.log('Auth user created:', authUser.$id)

    // Create user document in database
    await createUser({
      userId: authUser.$id,
      email: data.email,
      name: data.name,
    })

    return { success: true, userId: authUser.$id }
  } catch (error: any) {
    console.error('Registration error:', error)
    return { 
      success: false, 
      error: error.message || 'Failed to register user'
    }
  }
}

function generateId(): string {
  // Generate a random ID similar to Appwrite's format
  return 'user_' + Math.random().toString(36).substr(2, 24)
}

// ============================================
// LOGIN
// ============================================

export async function loginUser(email: string, password: string) {
  try {
    // For login, we'll use SDK's account.createEmailPasswordSession
    // This is server-side only and should work without instanceof issues
    const { account } = createAdminClient()
    
    console.log('Login user via SDK:', email)
    
    try {
      // Try SDK first
      const session = await account.createEmailPasswordSession(email, password)
      
      console.log('Session created via SDK:', { 
        id: session.$id, 
        hasSecret: !!session.secret,
        userId: session.userId 
      })

      // Set session cookie and userId cookie
      const cookieStore = await cookies()
      const sessionValue = session.secret || session.$id
      
      cookieStore.set(SESSION_COOKIE, sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      
      // Store userId for quick access
      cookieStore.set('appwrite-user-id', session.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      
      console.log('Session and userId cookies set successfully')
      return { success: true, session, userId: session.userId }
      
    } catch (sdkError: any) {
      // If SDK fails with instanceof error, fallback to REST API
      console.log('SDK login failed, trying REST API:', sdkError.message)
      
      // const { appwriteConfig } = await import('./appwrite.config')
      
      // Create session and let Appwrite set its own cookies
      const response = await fetch(
        `${appwriteConfig.endpoint}/account/sessions/email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': appwriteConfig.projectId,
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        console.error('Appwrite REST login error:', error)
        throw new Error(error.message || 'Invalid credentials')
      }

      const session = await response.json()
      console.log('Session created via REST:', { 
        id: session.$id,
        userId: session.userId,
        secret: session.secret ? 'present' : 'missing'
      })

      // Extract Appwrite's session cookie from response
      const cookiesHeader = response.headers.get('set-cookie')
      console.log('Appwrite cookies:', cookiesHeader ? 'present' : 'missing')
      
      // Parse the a_session cookie value if present
      let sessionSecret = session.$id // fallback to ID
      
      if (cookiesHeader) {
        // Extract a_session_* cookie value
        const match = cookiesHeader.match(/a_session_[^=]+=([^;]+)/)
        if (match && match[1]) {
          sessionSecret = match[1]
          console.log('Extracted session secret from cookie')
        }
      }
      
      // Also check if session.secret exists in the JSON response
      if (session.secret) {
        sessionSecret = session.secret
        console.log('Using session secret from JSON response')
      }
      
      // Set session cookie and userId cookie
      const cookieStore = await cookies()
      
      cookieStore.set(SESSION_COOKIE, sessionSecret, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      
      // Store userId in separate cookie for easy access
      cookieStore.set('appwrite-user-id', session.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
      
      console.log('Session and userId cookies set, secret length:', sessionSecret.length)
      return { success: true, session, userId: session.userId }
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return { 
      success: false, 
      error: error.message || 'Invalid credentials' 
    }
  }
}

// ============================================
// LOGOUT
// ============================================

export async function logoutUser() {
  try {
    const session = await getSession()
    if (session) {
      const { account } = createSessionClient(session)
      await account.deleteSession('current')
    }

    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
    cookieStore.delete('appwrite-user-id') // Also clear userId cookie

    return { success: true }
  } catch (error: any) {
    console.error('Logout error:', error)
    return { success: false, error: error.message }
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value || null
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get(SESSION_COOKIE)
    const userIdCookie = cookieStore.get('appwrite-user-id')
    
    if (!session || !userIdCookie) {
      console.log('getCurrentUser: No session or userId found')
      return null
    }

    const userId = userIdCookie.value
    console.log('getCurrentUser: Using userId from cookie:', userId)

    // Get user from Appwrite Auth using Admin API
    // const { appwriteConfig } = await import('./appwrite.config')
    
    const response = await fetch(
      `${appwriteConfig.endpoint}/users/${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': appwriteConfig.projectId,
          'X-Appwrite-Key': process.env.APPWRITE_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.log('getCurrentUser: Failed to get user:', errorText)
      return null
    }

    const authUser = await response.json()
    console.log('getCurrentUser: Auth user fetched:', { id: authUser.$id, email: authUser.email })
    
    // Get user details from database
    const dbUser = await getUserByEmail(authUser.email)
    console.log('getCurrentUser: DB user found:', !!dbUser)
    
    return {
      id: authUser.$id,
      email: authUser.email,
      name: dbUser?.name || authUser.name || '',
      image: dbUser?.image || null,
      role: dbUser?.role || 'owner', // Include role from database
    }
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

// ============================================
// PASSWORD MANAGEMENT
// ============================================

export async function updatePassword(oldPassword: string, newPassword: string) {
  try {
    const session = await getSession()
    if (!session) return { success: false, error: 'Not authenticated' }

    const { account } = createSessionClient(session)
    await account.updatePassword(newPassword, oldPassword)

    return { success: true }
  } catch (error: any) {
    console.error('Update password error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendPasswordRecoveryEmail(email: string) {
  try {
    // const { account } = createAdminClient()
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password`
    
    // await account.createRecovery(email, resetUrl)

    return { success: true }
  } catch (error: any) {
    console.error('Password recovery error:', error)
    return { success: false, error: error.message }
  }
}
*/

// Placeholder to avoid import errors
export const appwriteAuth = {}

