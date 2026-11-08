import { Poppins } from "next/font/google";


const mainFont = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
});


export { mainFont };