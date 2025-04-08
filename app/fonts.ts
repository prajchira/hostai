import localFont from 'next/font/local'

export const sohne = localFont({
  src: [
    {
        path: '../public/OTF/Söhne-Leicht.otf',
        weight: '300',
        style: 'normal',
      },
      {
        path: '../public/OTF/Söhne-LeichtKursiv.otf',
        weight: '300',
        style: 'italic',
      },
    {
      path: '../public/OTF/Söhne-Buch.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/OTF/Söhne-BuchKursiv.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../public/OTF/Söhne-Kräftig.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/OTF/Söhne-KräftigKursiv.otf',
      weight: '500',
      style: 'italic',
    }
  ],
  variable: '--font-sohne'
}) 