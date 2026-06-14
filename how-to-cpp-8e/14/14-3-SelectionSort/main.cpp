#include <iostream>
#include <cstdlib>

using namespace std;

template <typename T>
bool mySwap(T& a, T& b)
{
	T t = a;
	a = b;
	b = t;
	return true;
}

template <typename T>
bool selectionSort(T* arr, int len)
{
	// tail: a[len-1]
	// sort
	int smallSub = 0, left = 0;
	while (1)
	{
		if (left == len - 1) break;

		for (int i = left; i < len; i++)
			// find the smallest
			if (arr[smallSub] >= arr[i])
				smallSub = i;
		mySwap(arr[smallSub], arr[left]);
		left++; smallSub = left;
	}

	return true;
}

int main()
{
	int test1[10] = { 5,6,7,-8,8,3,1,-2,666,8 };
	float test2[8] = { 0.4, -0.6, 1.5, 2.765, 3.42123, 0.666, 100.7, -10000 };

	selectionSort<int>(test1, 10);
	selectionSort<float>(test2, 8);

	for (int i = 0; i < 10; i++)
		cout << test1[i] << " ";
	cout << endl;
	for (int i = 0; i < 8; i++)
		cout << test2[i] << " ";

	system("pause");
	return 0;
}