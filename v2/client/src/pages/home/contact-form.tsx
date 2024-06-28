import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useState } from "react"
import { restClient } from '@/lib/rest-client/rest-client'

interface FormData {
  name: string
  email: string
  phone: string
  message: string
}
const formSchema = z.object({
  name: z.string().min(2, {message:'Name is required'}),
  email: z.string().email(),
  phone: z.string().min(10, {message: 'Expecting 10 digits'}),
  message: z.string().min(2, {message: 'Message is required'}),
})

interface FormInputProps {
  label: string
  description?: string
  field: object
  textarea?: boolean
}
export const FormInput = ({label, description, field, textarea}:FormInputProps) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <FormControl>
      {textarea ?  <Textarea {...field}/> : <Input {...field}/>}
    </FormControl>
    {description ? <FormDescription>{description}</FormDescription> : undefined}
    <FormMessage/>
  </FormItem>
)

export const ContactForm = () => {
  const [sending, setSending] = useState(false)
  const form = useForm<FormData>({resolver: zodResolver(formSchema)})

  const onSubmit = (data: FormData) => {
    setSending(true)
    restClient.post('/api/v1/messages', data)
    .then(()=>{
      toast.success('Message sent')
      form.setValue("message", "")
    })
    .catch((err)=>{
      console.error(err)
      toast.error('Could not send message')
    })
    .finally(()=>setSending(false))
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="white space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={x=><FormInput label="Name" field={x.field}></FormInput>}
        />
        <FormField
          control={form.control}
          name="email"
          render={x=><FormInput label="Email" field={x.field}></FormInput>}
        />
        <FormField
          control={form.control}
          name="phone"
          render={x=><FormInput label="Phone" field={x.field}></FormInput>}
        />
        <FormField disabled={sending}
          control={form.control}
          name="message"
          render={x=><FormInput label="Message" field={x.field} textarea></FormInput>}
        />
        <Button type="submit" disabled={sending}>Send Message</Button>
      </form>
    </Form>
  )
}