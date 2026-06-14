#include <iostream>
#include <cstdlib>

using namespace std;

int fact(int input)
{
    int fac=1, val;
    val = input;
    while (val>=1)
    {
        fac *= val;
        val--;
    }
    return fac;
};

int pow(int num, int times)
{
    int i, result=1;
    i = times;
    while (i>=1)
    {
        result *= num;
        i--;
    }
    return result;
};

int main()
{
    int acc, x;
    double ee=1;
    cout << "This program calculates the value of 'e^x'." << endl;
    cout << "How many terms do you wish in the 'e' estimation summation?" << endl;
    cin >> acc;
    acc--;
    cout << "Please input x." << endl;
    cin >> x;
    while (acc>0)
    {
        ee += static_cast < double > (pow(x,acc)) / static_cast < double > (fact(acc));
        acc--;
    }

    cout << "The estimated 'e^x' is " << ee << "." << endl;

    system("pause");

    return 0;
}