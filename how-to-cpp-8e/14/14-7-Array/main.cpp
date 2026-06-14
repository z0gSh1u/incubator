#include <iostream>
#include <stdexcept>

#include <initializer_list>

#include <cstdlib>

using namespace std;

template <typename T>
class Array
{
private:
	int size;
	T* ptr;

public:
	// constructor
	Array(int arraySize, T initVal)
	{
		if (arraySize > 0)
			size = arraySize;
		else
			throw invalid_argument("Array size must be greater than 0");
		
		ptr = new T[size];
		for (int i = 0; i < size; i++)
			ptr[i] = initVal;
	}

	// copy constructor
	Array(const Array& t)
	{
		// avoid self assignment
		if (&t == this)
			return;
		else
		{
			this->size = t.size;
			this->ptr = new T[size];
			for (int i = 0; i < size; i++)
				(this->ptr)[i] = t.ptr[i];
		}
	}

	// destructor
	~Array()
	{
		delete[] ptr;
	}

	// getSize
	int getSize()
	{
		return size;
	}

	// assignment op
	Array& operator = (const Array& a)
	{
		if (a == (*this))
			return (*this);

		if (this->size != a.size)
		{
			delete[] ptr;
			this->size = a.size;
			this->ptr = new T[size];
		}

		for (int i = 0; i < size; i++)
			(this->ptr)[i] = t.ptr[i];
	}

	// equal op
	bool operator == (const Array& a)
	{
		if (this->size != a.size)
			return false;
		for (int i = 0; i < size; i++)
			if ( (this->ptr)[i] != t.ptr[i] )
				return false;
		return true;
	}

	// subscript op
	T& operator [] (int a)
	{
		if (a < 0 || a > this->size - 1)
			throw out_of_range("Subscript out of range");
		return ptr[a];
	}

	// subscript op const ver
	T operator [] (int a) const
	{
		if (a < 0 || a > this->size - 1)
			throw out_of_range("Subscript out of range");
		return ptr[a];
	}

	// input op
	template <typename T>
	friend istream& operator >> (istream& is, Array<T>& a);

	// output op
	template <typename T>
	friend ostream& operator << (ostream& os, Array<T>& a);

};

template <typename T>
istream& operator >> (istream& is, Array<T>& a)
{
	for (int i = 0; i < a.size; i++)
		is >> a[i];
	return is;
}

template <typename T>
ostream& operator << (ostream& os, Array<T>& a)
{
	for (int i = 0; i < a.size; i++)
	{
		os << a[i] << " ";
		if ( (i + 1) % 4 == 0)
			os << endl;
	}
	return os;
}

int main()
{
	Array<int> a(4, 0);
	cin >> a;
	cout << a;
	cout << a[3] << endl;
	cout << (a[3] == a[2]) << endl;
	a[3] = a[2];
	cout << (a[3] == a[2]) << endl;

	system("pause");
	return 0;
}