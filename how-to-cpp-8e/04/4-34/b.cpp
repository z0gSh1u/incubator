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

int main()
{
    int acc;
    double ee=1;
    cout << "How many terms do you wish in the summation?" << endl;
    cin >> acc;
    acc--;
    while (acc>0)
    {
        ee += 1.0 / static_cast < double > (fact(acc));
        acc--;
    }

    cout << "The estimated 'e' is " << ee << "." << endl;

    system("pause");

    return 0;
}