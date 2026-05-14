'use client'
import { useRef } from 'react'
import QRCode from 'react-qr-code'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function QRCertificate({ member, onClose }) {
  const certificateRef = useRef(null)

  const generatePDF = async () => {
    const element = certificateRef.current
    if (!element) return

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })
      
      const imgWidth = 297 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`LEO_Certificate_${member.memberId}.pdf`)
      
      onClose()
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating certificate. Please try again.')
    }
  }

const verificationUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/verify/member/${member.memberId}`
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div>
      {/* Certificate Content (Hidden, for PDF generation) */}
      <div className="hidden">
        <div
          ref={certificateRef}
          className="w-[1100px] h-[780px] bg-white p-12 relative"
          style={{ fontFamily: 'Arial, sans-serif' }}
        >
          {/* Border */}
          <div className="border-8 border-secondary h-full w-full relative p-8">
            {/* Decorative corners */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-secondary"></div>
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-secondary"></div>
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-secondary"></div>
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-secondary"></div>
            
            <div className="flex flex-col items-center justify-center h-full text-center">
              {/* Logo/Badge */}
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                <span className="text-secondary text-3xl font-bold">L</span>
              </div>
              
              {/* Title */}
              <h1 className="text-5xl font-bold text-primary mb-2">Certificate of Service</h1>
              <div className="w-32 h-0.5 bg-secondary mx-auto mb-6"></div>
              
              {/* Body */}
              <p className="text-xl text-gray-600 mb-4">This certificate is proudly presented to</p>
              <h2 className="text-4xl font-bold text-primary mb-4">{member.name}</h2>
              <p className="text-lg text-gray-600 mb-2">Member ID: {member.memberId}</p>
              <p className="text-lg text-gray-600 mb-2">Role: {member.currentRole}</p>
              <p className="text-lg text-gray-600 mb-6">Batch: {member.batch}</p>
              
              <p className="text-md text-gray-500 mb-8 max-w-xl mx-auto">
                In recognition of their dedicated service and leadership contributions 
                to the Leo Club of KUSMS, empowering community health and development.
              </p>
              
              {/* QR Code */}
              <div className="flex justify-center mb-6">
                <div className="bg-white p-2 border-2 border-secondary rounded-lg">
                  <QRCode value={verificationUrl} size={100} />
                </div>
              </div>
              
              <p className="text-xs text-gray-400 mb-2">Scan to verify Live CV</p>
              <p className="text-xs text-gray-400">Issued: {today}</p>
              
              {/* Signature */}
              <div className="absolute bottom-12 left-12 right-12 flex justify-between">
                <div className="text-left">
                  <div className="border-t-2 border-gray-300 w-48 pt-2"></div>
                  <p className="text-sm text-gray-500">Club President</p>
                </div>
                <div className="text-right">
                  <div className="border-t-2 border-gray-300 w-48 pt-2"></div>
                  <p className="text-sm text-gray-500">Leo Club KUSMS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal UI */}
      <div>
        <h2 className="text-2xl font-bold text-primary mb-4">Generate QR Certificate</h2>
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <div className="inline-block bg-white p-4 rounded-lg shadow-md mb-4">
              <QRCode value={verificationUrl} size={120} />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Certificate for: <strong>{member.name}</strong>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Verification URL will be embedded as QR code
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={generatePDF}
            className="btn-primary flex-1"
          >
            Download PDF Certificate
          </button>
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
