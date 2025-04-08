"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ContactManagerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  propertyManagerName: string;
}

export default function ContactManagerDialog({ isOpen, onClose, propertyManagerName }: ContactManagerDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="fixed inset-0 bg-background/80
          data-[state=open]:animate-in data-[state=closed]:animate-out
          data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
          duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 flex justify-end">
        <div className="
          h-full w-full sm:w-[600px] bg-background border-l shadow-lg p-6
          animate-in slide-in-from-right duration-300
        ">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl text-blue-700 mb-2">Contact manager</h2>
              <p className="text-gray-600">
                Connect with property manager and discuss onboarding your home to their portfolio.
              </p>
            </div>
          </div>

          <div className="space-y-6 py-4">
            <div>
              <label className="text-base font-medium mb-2 block">Full name</label>
              <Input placeholder="Kevin Flynn" className="bg-gray-50" />
            </div>
            
            <div>
              <label className="text-base font-medium mb-2 block">Email</label>
              <Input type="email" placeholder="kevin@encom.com" className="bg-gray-50" />
            </div>
            
            <div>
              <label className="text-base font-medium mb-2 block">Phone number</label>
              <Input placeholder="+1(111)111-111" className="bg-gray-50" />
            </div>
            
            <div>
              <label className="text-base font-medium mb-2 block">Property address</label>
              <Input placeholder="1234 Joshua Tree lane" className="bg-gray-50" />
            </div>
            
            <div>
              <label className="text-base font-medium mb-2 block">Message</label>
              <Textarea className="h-20 bg-gray-50" />
            </div>

            <p className="text-gray-500 text-sm">
              You can also email us at support@hostai.app
            </p>

            <Button 
              onClick={onClose}
              className="w-full bg-accent hover:bg-accent-hover text-lg py-4"
            >
              Send message
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
