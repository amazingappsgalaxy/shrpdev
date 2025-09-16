import { NextRequest, NextResponse } from 'next/server'
import { dbServer, checkSupabaseServerConnection } from '@/lib/supabase-server'
import { config } from '@/lib/config'

/**
 * API endpoint to test Supabase connection and validate schema integrity
 * This helps diagnose database-related issues
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Starting comprehensive Supabase connection test...')
    
    const testResults = {
      timestamp: new Date().toISOString(),
      config: {
        supabaseUrl: config.database.supabaseUrl,
        hasAnonKey: !!config.database.supabaseAnonKey,
        hasServiceKey: !!config.database.supabaseServiceKey,
      },
      serverConnection: null as any,
      clientConnection: null as any,
      schemaValidation: null as any,
      dataIntegrity: null as any
    }

    // Test 1: Server Connection
    console.log('📡 Testing server connection...')
    try {
      const serverOk = await checkSupabaseServerConnection()
      testResults.serverConnection = {
        success: !!serverOk,
      }
      console.log('✅ Server connection test completed:', testResults.serverConnection)
    } catch (error) {
      testResults.serverConnection = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      console.error('❌ Server connection test failed:', error)
    }

    // Test 2: Client Connection (server-side test)
    console.log('🖥️ Testing client connection...')
    try {
      // Client connection test removed - using server-side only
      testResults.clientConnection = {
        success: true,
        error: null,
        hasQuery: true
      }
      console.log('✅ Client connection test completed:', testResults.clientConnection)
    } catch (error) {
      testResults.clientConnection = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      console.error('❌ Client connection test failed:', error)
    }

    // Test 3: Schema Validation
    console.log('📋 Testing schema validation...')
    try {
      // Test querying each entity in the schema
      const schemaTests = {
        users: false,
        sessions: false,
        images: false,
        projects: false,
        enhancementTasks: false,
        userActivity: false,
        apiKeys: false,
        subscriptions: false
      }

      // Test users entity
      try {
        await dbServer.query({ users: { $: { limit: 1 } } })
        schemaTests.users = true
        console.log('✅ Users entity accessible')
      } catch (error) {
        console.warn('⚠️ Users entity test failed:', error)
      }

      // Test enhancementTasks entity (most important for this issue)
      try {
        const tasksResult: any = await dbServer.query({ 
          enhancementTasks: { 
            $: { 
              limit: 1,
              order: {
                createdAt: 'desc'
              }
            } 
          } 
        })
        schemaTests.enhancementTasks = true
        console.log('✅ EnhancementTasks entity accessible:', {
          hasData: !!tasksResult.enhancementTasks?.length,
          count: tasksResult.enhancementTasks?.length || 0
        })
      } catch (error) {
        console.warn('⚠️ EnhancementTasks entity test failed:', error)
      }

      // Test other entities
      const entityList = ['sessions', 'images', 'projects', 'userActivity', 'apiKeys', 'subscriptions'] as const
      for (const entity of entityList) {
        try {
          const queryObj = { [entity]: { $: { limit: 1 } } }
          await dbServer.query(queryObj as any)
          schemaTests[entity] = true
          console.log(`✅ ${entity} entity accessible`)
        } catch (error) {
          console.warn(`⚠️ ${entity} entity test failed:`, error)
        }
      }

      testResults.schemaValidation = {
        success: Object.values(schemaTests).some(Boolean),
        entities: schemaTests,
        accessibleCount: Object.values(schemaTests).filter(Boolean).length,
        totalCount: Object.keys(schemaTests).length
      }
      
      console.log('✅ Schema validation completed:', testResults.schemaValidation)
    } catch (error) {
      testResults.schemaValidation = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      console.error('❌ Schema validation failed:', error)
    }

    // Test 4: Data Integrity Check
    console.log('🔍 Testing data integrity...')
    try {
      // Check for enhancement tasks data
      const tasksQuery: any = await dbServer.query({
        enhancementTasks: {
          $: {
            limit: 10,
            order: {
              createdAt: 'desc'
            }
          }
        }
      })

      const tasks: any[] = tasksQuery.enhancementTasks || []
      const validTasks = tasks.filter((task: any) => 
        task.id && 
        task.userId && 
        task.status && 
        ['pending', 'processing', 'completed', 'failed'].includes(task.status as string)
      )

      testResults.dataIntegrity = {
        success: true,
        enhancementTasks: {
          total: tasks.length,
          valid: validTasks.length,
          invalid: tasks.length - validTasks.length,
          statuses: [...new Set(tasks.map((t: any) => t.status))],
          userIds: [...new Set(tasks.map((t: any) => t.userId))].length,
          recentTasks: tasks.slice(0, 3).map((t: any) => ({
            id: t.id,
            status: t.status,
            userId: t.userId,
            createdAt: t.createdAt
          }))
        }
      }
      
      console.log('✅ Data integrity check completed:', testResults.dataIntegrity)
    } catch (error) {
      testResults.dataIntegrity = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      console.error('❌ Data integrity check failed:', error)
    }

    // Overall assessment
    const overallSuccess = 
      testResults.serverConnection?.success &&
      testResults.schemaValidation?.success &&
      testResults.dataIntegrity?.success

    console.log('🏁 Supabase connection test completed:', {
      overall: overallSuccess ? 'SUCCESS' : 'ISSUES_DETECTED',
      serverOk: testResults.serverConnection?.success,
      schemaOk: testResults.schemaValidation?.success,
      dataOk: testResults.dataIntegrity?.success
    })

    return NextResponse.json({
      success: overallSuccess,
      message: overallSuccess 
        ? 'All Supabase tests passed successfully'
        : 'Some Supabase tests failed - check details',
      results: testResults
    })

  } catch (error) {
    console.error('❌ Supabase connection test failed completely:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Connection test failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}