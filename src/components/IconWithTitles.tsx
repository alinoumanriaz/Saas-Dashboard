import { BsBuilding } from 'react-icons/bs'

const IconWithTitles = () => {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
                    <BsBuilding className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-950">
                        Company Information
                    </h2>
                    <p className="text-sm text-slate-500">
                        Essential business and contact information
                    </p>
                </div>
            </div>
        </div>
    )
}

export default IconWithTitles
