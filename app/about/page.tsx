import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-black text-vdu-green font-mono p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-vdu-green hover:text-vdu-green-dim transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Radio
        </Link>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-4 glow">UNHEARD RADIO</h1>
            <p className="text-xl text-vdu-green-dim mb-6">
              your portal to the strange side of sound
            </p>
          </div>
          
          <div className="space-y-6">
            <p className="text-lg leading-relaxed">
              Welcome to the underground. While everyone else feeds you the same popular frequencies, 
              we dig deeper into the weird, wonderful, and completely overlooked corners of global radio.
            </p>
            
            <p className="leading-relaxed">
              Our reverse-algorithm doesn't chase listeners—it finds the stations nobody else bothers with. 
              The glitchy transmissions. The ghost signals. The offbeat gems broadcasting to empty rooms 
              at 3 AM.
            </p>
            
            <p className="leading-relaxed">
              This is anti-algorithm radio. Always live. Never normal.
            </p>
            
            <p className="leading-relaxed">
              Every station here is real, broadcasting right now from some forgotten corner of the world. 
              No playlists. No recommendations. Just pure, unfiltered discovery of sounds you never 
              knew existed.
            </p>
          </div>
          
          <div className="border-t border-vdu-green/20 pt-6 mt-8">
            <div className="text-sm text-vdu-green-dim space-y-2">
              <p>Built by Z13labs</p>
              <p>Contact: hello@z13labs.com</p>
              <Link href="/privacy" className="block text-vdu-green hover:text-vdu-green-dim underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}