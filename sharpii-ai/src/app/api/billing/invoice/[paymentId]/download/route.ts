import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { DODO_PAYMENTS_CONFIG } from '@/lib/dodo-payments-config'
import DodoPayments from 'dodopayments'

const dodo = new DodoPayments({
  bearerToken: DODO_PAYMENTS_CONFIG.apiKey,
  environment: DODO_PAYMENTS_CONFIG.environment as 'live_mode' | 'test_mode'
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    // Await params first to fix Next.js 15 warning
    const { paymentId } = await params

    // Get user session using better-auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers) as Record<string, string>
    })

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    try {
      console.log('🧾 Fetching invoice for payment:', paymentId)
      
      // Try multiple Dodo API endpoints for invoice retrieval
      const endpoints = [
        // Primary endpoint - Get invoice PDF directly
        `https://api.dodopayments.com/v1/payments/${paymentId}/invoice`,
        // Fallback endpoint - Get payment details with invoice
        `https://api.dodopayments.com/v1/payments/${paymentId}`,
        // Legacy endpoint format
        `https://${DODO_PAYMENTS_CONFIG.environment === 'live_mode' ? 'live' : 'test'}.dodopayments.com/invoices/payments/${paymentId}`
      ]
      
      for (const [index, endpoint] of endpoints.entries()) {
        try {
          console.log(`🔗 Trying endpoint ${index + 1}:`, endpoint)
          
          const invoiceResponse = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${DODO_PAYMENTS_CONFIG.apiKey}`,
              'Accept': 'application/pdf, application/json'
            }
          })
          
          console.log(`📡 Response status for endpoint ${index + 1}:`, invoiceResponse.status)
          
          if (invoiceResponse.ok) {
            const contentType = invoiceResponse.headers.get('content-type')
            console.log('📄 Content type:', contentType)
            
            if (contentType?.includes('application/pdf')) {
              // Return the PDF directly
              const pdfBuffer = await invoiceResponse.arrayBuffer()
              
              return new NextResponse(pdfBuffer, {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `attachment; filename="invoice-${paymentId}.pdf"`,
                  'Cache-Control': 'private, max-age=300'
                }
              })
            } else if (contentType?.includes('application/json')) {
              // Parse JSON response and check for PDF URL or invoice data
              const jsonData = await invoiceResponse.json()
              console.log('📋 Got JSON response:', jsonData)
              
              // Check if there's a direct PDF URL in the response
              if (jsonData.invoice_pdf || jsonData.pdf_url || jsonData.invoice_url) {
                const pdfUrl = jsonData.invoice_pdf || jsonData.pdf_url || jsonData.invoice_url
                console.log('🔗 Found PDF URL in response:', pdfUrl)
                
                // Fetch the PDF from the URL
                const pdfResponse = await fetch(pdfUrl, {
                  headers: {
                    'Authorization': `Bearer ${DODO_PAYMENTS_CONFIG.apiKey}`
                  }
                })
                
                if (pdfResponse.ok && pdfResponse.headers.get('content-type')?.includes('application/pdf')) {
                  const pdfBuffer = await pdfResponse.arrayBuffer()
                  
                  return new NextResponse(pdfBuffer, {
                    headers: {
                      'Content-Type': 'application/pdf',
                      'Content-Disposition': `attachment; filename="invoice-${paymentId}.pdf"`,
                      'Cache-Control': 'private, max-age=300'
                    }
                  })
                }
              }
              
              // If no PDF URL, use the JSON data to generate a custom invoice
              return await generateEnhancedInvoice(jsonData, paymentId, session.user)
            }
          } else {
            console.warn(`⚠️ Endpoint ${index + 1} returned error:`, invoiceResponse.status, invoiceResponse.statusText)
            const errorText = await invoiceResponse.text()
            console.warn(`⚠️ Error details for endpoint ${index + 1}:`, errorText)
          }
        } catch (endpointError) {
          console.warn(`⚠️ Error with endpoint ${index + 1}:`, endpointError)
          continue // Try next endpoint
        }
      }
      
      // If all endpoints fail, generate a simple invoice
      console.log('⚠️ All Dodo API endpoints failed, generating fallback invoice')
      return await generateSimpleInvoice(paymentId, session.user)
      
    } catch (dodoError: any) {
      console.error('❌ Dodo API error:', dodoError)
      
      // Fallback: generate a simple invoice
      return await generateSimpleInvoice(paymentId, session.user)
    }

  } catch (error) {
    console.error('Invoice download error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to download invoice',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

async function generateEnhancedInvoice(invoiceData: any, paymentId: string, user: any) {
  // Generate enhanced invoice from Dodo data
  const invoice = {
    invoiceNumber: invoiceData.invoice_number || `INV-${paymentId.slice(-8).toUpperCase()}`,
    paymentId,
    amount: invoiceData.amount || invoiceData.total_amount || 'N/A',
    currency: invoiceData.currency || 'USD',
    status: invoiceData.status || 'completed',
    issuedAt: invoiceData.created_at || invoiceData.invoice_date || new Date().toISOString(),
    dueDate: invoiceData.due_date,
    paidAt: invoiceData.paid_at,
    user: {
      email: user.email,
      name: user.name || user.email
    },
    company: {
      name: 'SharpII AI',
      address: 'AI Enhancement Services Platform',
      email: 'support@sharpii.ai',
      website: 'https://sharpii.ai'
    },
    items: invoiceData.line_items || [{
      description: invoiceData.product_name || 'AI Enhancement Credits',
      quantity: 1,
      unitPrice: invoiceData.amount || 0,
      total: invoiceData.amount || 0
    }]
  }

  // Create enhanced HTML invoice
  const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoice.invoiceNumber}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            background: #f8f9fa; 
        }
        .invoice-container { 
            background: white; 
            padding: 40px; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 40px; 
            padding-bottom: 20px; 
            border-bottom: 2px solid #e9ecef; 
        }
        .logo-section h1 { 
            color: #2563eb; 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 5px; 
        }
        .logo-section p { 
            color: #6b7280; 
            font-size: 14px; 
        }
        .invoice-info { 
            text-align: right; 
        }
        .invoice-info h2 { 
            color: #1f2937; 
            font-size: 32px; 
            margin-bottom: 10px; 
        }
        .invoice-info p { 
            color: #6b7280; 
            font-size: 14px; 
            margin: 2px 0; 
        }
        .parties { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 40px; 
        }
        .party { 
            flex: 1; 
            margin-right: 40px; 
        }
        .party:last-child { 
            margin-right: 0; 
        }
        .party h3 { 
            color: #1f2937; 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 10px; 
            padding: 8px 12px; 
            background: #f3f4f6; 
            border-radius: 5px; 
        }
        .party-content { 
            padding-left: 12px; 
        }
        .party p { 
            margin: 4px 0; 
            color: #4b5563; 
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 30px 0; 
            background: white; 
        }
        th { 
            background: #f8fafc; 
            padding: 15px; 
            text-align: left; 
            font-weight: 600; 
            color: #1f2937; 
            border-bottom: 2px solid #e5e7eb; 
        }
        td { 
            padding: 15px; 
            border-bottom: 1px solid #f1f5f9; 
        }
        .amount { 
            text-align: right; 
            font-weight: 600; 
        }
        .total-row { 
            background: #f8fafc; 
            font-weight: 700; 
            font-size: 16px; 
        }
        .total-row td { 
            border-bottom: none; 
            border-top: 2px solid #e5e7eb; 
        }
        .status { 
            display: inline-block; 
            padding: 6px 12px; 
            border-radius: 20px; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
        }
        .status.paid { 
            background: #d1fae5; 
            color: #065f46; 
        }
        .status.pending { 
            background: #fef3c7; 
            color: #92400e; 
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
        }
        .footer p { 
            color: #6b7280; 
            font-size: 14px; 
            margin: 5px 0; 
        }
        .footer .website { 
            color: #2563eb; 
            text-decoration: none; 
            font-weight: 500; 
        }
        @media print {
            body { 
                background: white; 
                padding: 0; 
            }
            .invoice-container { 
                box-shadow: none; 
                border-radius: 0; 
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo-section">
                <h1>${invoice.company.name}</h1>
                <p>${invoice.company.address}</p>
                <p>${invoice.company.email}</p>
                <p>${invoice.company.website}</p>
            </div>
            <div class="invoice-info">
                <h2>INVOICE</h2>
                <p><strong>Invoice #:</strong> ${invoice.invoiceNumber}</p>
                <p><strong>Payment ID:</strong> ${invoice.paymentId}</p>
                <p><strong>Date:</strong> ${new Date(invoice.issuedAt).toLocaleDateString()}</p>
                ${invoice.dueDate ? `<p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ''}
                <div class="status ${invoice.status === 'completed' || invoice.status === 'paid' ? 'paid' : 'pending'}">
                    ${invoice.status === 'completed' ? 'paid' : invoice.status}
                </div>
            </div>
        </div>
        
        <div class="parties">
            <div class="party">
                <h3>Bill To</h3>
                <div class="party-content">
                    <p><strong>${invoice.user.name}</strong></p>
                    <p>${invoice.user.email}</p>
                </div>
            </div>
            <div class="party">
                <h3>Payment Details</h3>
                <div class="party-content">
                    <p><strong>Amount:</strong> $${typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount}</p>
                    <p><strong>Currency:</strong> ${invoice.currency}</p>
                    ${invoice.paidAt ? `<p><strong>Paid:</strong> ${new Date(invoice.paidAt).toLocaleDateString()}</p>` : ''}
                </div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th class="amount">Unit Price</th>
                    <th class="amount">Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.items.map((item: any) => `
                    <tr>
                        <td>${item.description}</td>
                        <td>${item.quantity}</td>
                        <td class="amount">$${typeof item.unitPrice === 'number' ? item.unitPrice.toFixed(2) : item.unitPrice}</td>
                        <td class="amount">$${typeof item.total === 'number' ? item.total.toFixed(2) : item.total}</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="3"><strong>Total Amount</strong></td>
                    <td class="amount"><strong>$${typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="footer">
            <p><strong>Thank you for using SharpII AI!</strong></p>
            <p>For support or questions about this invoice, please contact us at ${invoice.company.email}</p>
            <p>Visit us at <a href="${invoice.company.website}" class="website">${invoice.company.website}</a></p>
        </div>
    </div>
</body>
</html>`

  // Return HTML as downloadable file with proper headers
  return new NextResponse(invoiceHTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="invoice-${paymentId}.html"`,
      'Cache-Control': 'private, max-age=300'
    }
  })
}

async function generateSimpleInvoice(paymentId: string, user: any) {
  // Generate a simple HTML invoice when Dodo API is not available
  const invoiceData = {
    invoiceNumber: `INV-${paymentId.slice(-8).toUpperCase()}`,
    paymentId,
    user: {
      email: user.email,
      name: user.name || user.email
    },
    issuedAt: new Date().toISOString(),
    company: {
      name: 'SharpII AI',
      address: 'AI Enhancement Services Platform',
      email: 'support@sharpii.ai',
      website: 'https://sharpii.ai'
    }
  }

  // Create a simple HTML invoice
  const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice ${invoiceData.invoiceNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { margin: 20px 0; }
        .company-info { margin-bottom: 20px; }
        .customer-info { margin-bottom: 20px; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .status { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>INVOICE</h1>
        <h2>${invoiceData.invoiceNumber}</h2>
    </div>
    
    <div class="company-info">
        <h3>${invoiceData.company.name}</h3>
        <p>${invoiceData.company.address}</p>
        <p>Email: ${invoiceData.company.email}</p>
        <p>Website: ${invoiceData.company.website}</p>
    </div>
    
    <div class="customer-info">
        <h3>Bill To:</h3>
        <p><strong>${invoiceData.user.name}</strong></p>
        <p>${invoiceData.user.email}</p>
    </div>
    
    <div class="invoice-details">
        <p><strong>Invoice Date:</strong> ${new Date(invoiceData.issuedAt).toLocaleDateString()}</p>
        <p><strong>Payment ID:</strong> ${invoiceData.paymentId}</p>
        <p><strong>Status:</strong> <span class="status">COMPLETED</span></p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>AI Enhancement Credits - Payment Processed</td>
                <td>Payment Completed Successfully</td>
            </tr>
        </tbody>
    </table>
    
    <div class="footer">
        <p><strong>Thank you for using SharpII AI!</strong></p>
        <p>For support, contact: ${invoiceData.company.email}</p>
        <p>Visit: <a href="${invoiceData.company.website}">${invoiceData.company.website}</a></p>
    </div>
</body>
</html>`

  return new NextResponse(invoiceHTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="invoice-${paymentId}.html"`,
      'Cache-Control': 'private, max-age=300'
    }
  })
}