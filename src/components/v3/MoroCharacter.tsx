/** Authored SVG interpretation of the supplied MORO silhouette; real movable eye layers. */
export function MoroCharacter() {
  return <svg className="moro-art" viewBox="0 0 180 210" fill="none" aria-hidden="true">
    <defs>
      <radialGradient id="moro-skin" cx=".76" cy=".24" r=".9"><stop stopColor="#bfd1b4"/><stop offset=".48" stopColor="#91aa8a"/><stop offset=".8" stopColor="#637b60"/><stop offset="1" stopColor="#3c513d"/></radialGradient>
      <linearGradient id="moro-eye" x2="1" y2="1"><stop stopColor="#111c14"/><stop offset="1" stopColor="#344333"/></linearGradient>
      <filter id="moro-grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".12"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
      <clipPath id="moro-silhouette"><path d="M54 17C36 13 34 28 43 46C53 67 26 94 21 124C14 162 27 187 60 192L143 197C167 198 171 187 153 179C142 173 151 165 151 144C154 94 116 31 74 20C65 17 58 16 54 17Z"/></clipPath>
    </defs>
    <ellipse className="moro-shadow" cx="91" cy="198" rx="54" ry="5" fill="#283c26" opacity=".13"/>
    <g className="moro-body"><g clipPath="url(#moro-silhouette)"><path d="M0 0H180V205H0Z" fill="url(#moro-skin)" filter="url(#moro-grain)"/><path d="M43 22C59 15 95 30 117 60" stroke="#e2ead7" strokeWidth="2" opacity=".32"/></g>
      <g className="moro-eyes"><ellipse cx="82" cy="94" rx="5.7" ry="9" fill="url(#moro-eye)"/><ellipse cx="121" cy="91" rx="5.2" ry="8.5" fill="url(#moro-eye)"/><circle cx="83.4" cy="91.5" r="1.3" fill="#fff" opacity=".45"/><circle cx="122" cy="89" r="1.2" fill="#fff" opacity=".45"/></g>
    </g>
  </svg>;
}
