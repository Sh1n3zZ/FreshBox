import { 
  Card, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

interface ProductProps {
  title: string;
  imageUrl: string;
  alt?: string;
}

export function BlindBox({ title, imageUrl, alt = "Product Image" }: ProductProps) {
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="relative h-48 w-full">
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export default BlindBox;
