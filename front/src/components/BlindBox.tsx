import { 
  Card, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { GlobalBlindboxCover } from "@/components/GlobalBlindboxCover";

interface ProductProps {
  title: string;
  imageUrl: string;
  alt?: string;
}

export function BlindBox({ title, imageUrl, alt = "Product Image" }: ProductProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md p-0">
      <div className="flex flex-col h-full">
        <div className="w-full h-48">
          <GlobalBlindboxCover
            cover={imageUrl}
            size="full"
            alt={alt}
            className="rounded-none"
          />
        </div>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      </div>
    </Card>
  );
}

export default BlindBox;
