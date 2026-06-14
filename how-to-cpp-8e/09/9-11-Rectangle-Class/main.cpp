#include <iostream>
#include <stdexcept>
#include <cstdlib>

using namespace std;

class Rectangle
{
private:
	double length;
	double width;

public:
	Rectangle(double length=1, double width=1)
	{
		this->length=length;
		this->width=width;
	}

	void setLength(double length)
	{
		if (! (length>0.0 && length<20.0) )
			throw invalid_argument("Length out of range.");
		this->length=length;
	}

	void setWidth(double width)
	{
		if (! (width>0.0 && width<20.0) )
			throw invalid_argument("Width out of range.");
		this->width=width;
	}

	double getLength()
	{
		return length;
	}

	double getWidth()
	{
		return width;
	}

	double perimeter()
	{
		return 2*(length+width);
	}

	double area()
	{
		return length*width;
	}
};

int main()
{
	Rectangle a(2.7,3.12);
	cout << a.perimeter() << endl;
	cout << a.area() << endl;
	system("pause");
	return 0;
}